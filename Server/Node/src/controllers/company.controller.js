/**
 * Company Controller
 * 
 * Clean orchestration layer - delegates business logic to services
 */

const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const PDFDocument = require("pdfkit");

// Services
const { calculateESG } = require("../services/esg.service");
const { saveMetrics, saveESGScores, getReportMetrics, getReportScores } = require("../services/metrics.service");

// Utils
const { extractMetrics, calculateCarbonFootprint } = require("../utils/metricExtractor");
const { generateRecommendations } = require("../utils/aiRecommendation");

/**
 * Upload and process ESG report
 */
const uploadReport = async (req, res) => {
  let filePath = null;

  try {
    const companyUserId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    filePath = file.path;

    // ========================================
    // STEP 1: Get Company ID
    // ========================================
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }

    const companyId = companyResult.rows[0].id;

    // ========================================
    // STEP 2: Send to Flask API for Processing
    // ========================================
    let flaskResponse = null;
    let extractionError = null;

    try {
      console.log("📤 Sending file to Flask API for ESG extraction...");

      const formData = new FormData();
      formData.append("file", fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const apiResponse = await axios.post(
        "http://localhost:5000/extract",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000, // 5 minutes timeout
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      if (apiResponse.data && apiResponse.data.status === "success") {
        flaskResponse = apiResponse.data;
        console.log("✅ ESG metrics extracted successfully");
      } else {
        throw new Error("Flask API did not return success status");
      }
    } catch (flaskError) {
      console.error("❌ Flask API Error:", flaskError.message);
      extractionError = flaskError.message;
      // Continue with null metrics instead of failing
    }

    // ========================================
    // STEP 3: Extract Metrics from Flask Response
    // ========================================
    const metrics = extractMetrics(flaskResponse);
    
    console.log("📊 Extracted Metrics:", {
      scope1: metrics.scope1,
      scope2: metrics.scope2,
      scope3: metrics.scope3,
      hasData: Object.values(metrics).some(v => v !== null)
    });

    // ========================================
    // STEP 4: Calculate ESG Scores
    // ========================================
    const scores = calculateESG(metrics);
    
    console.log("🎯 Calculated ESG Scores:", scores);

    // ========================================
    // STEP 5: Calculate Carbon Footprint
    // ========================================
    const carbonFootprint = calculateCarbonFootprint(
      metrics.scope1,
      metrics.scope2,
      metrics.scope3
    );

    // ========================================
    // STEP 6: Upload to Cloudinary
    // ========================================
    console.log("☁️  Uploading to Cloudinary...");
    
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      folder: "Ecolens",
      public_id: `company_${companyId}_${Date.now()}`,
    });

    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error("Cloudinary upload failed");
    }

    const fileUrl = uploadResult.secure_url;
    console.log("✅ File uploaded to Cloudinary");

    // ========================================
    // STEP 7: Delete Local File
    // ========================================
    fs.unlinkSync(file.path);
    filePath = null; // Mark as deleted

    // ========================================
    // STEP 8: Insert Report Record
    // ========================================
    const reportResult = await pool.query(
      `INSERT INTO reports (company_id, file_name, file_type, file_url, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [companyId, file.originalname, file.mimetype, fileUrl, "processed"]
    );

    const reportId = reportResult.rows[0].id;
    console.log(`📝 Report created with ID: ${reportId}`);

    // ========================================
    // STEP 9: Save Metrics to Database
    // ========================================
    await saveMetrics(reportId, metrics, carbonFootprint);
    console.log("✅ Metrics saved to database");

    // ========================================
    // STEP 10: Save ESG Scores to Database
    // ========================================
    await saveESGScores(reportId, scores);
    console.log("✅ ESG scores saved to database");

    // ========================================
    // STEP 11: Generate AI Recommendations
    // ========================================
    try {
      const existing = await pool.query(
        "SELECT id FROM ai_recommendations WHERE report_id = $1",
        [reportId]
      );

      if (existing.rows.length === 0) {
        console.log("🤖 Generating AI recommendations...");
        
        const recommendations = await generateRecommendations({
          overall: scores.overall,
          environmental: scores.environmental,
          social: scores.social,
          governance: scores.governance,
          carbon: carbonFootprint,
          energy: metrics.energy,
          water: metrics.water,
          waste: metrics.waste,
        });

        for (const rec of recommendations) {
          await pool.query(
            `INSERT INTO ai_recommendations 
             (report_id, title, description, impact, effort)
             VALUES ($1, $2, $3, $4, $5)`,
            [reportId, rec.title, rec.description, rec.impact, rec.effort]
          );
        }
        
        console.log(`✅ ${recommendations.length} recommendations generated`);
      }
    } catch (recError) {
      console.error("⚠️  Failed to generate recommendations:", recError.message);
      // Don't fail the whole upload if recommendations fail
    }

    // ========================================
    // STEP 12: Return Success Response
    // ========================================
    return res.status(201).json({
      success: true,
      message: "Report processed successfully",
      data: {
        reportId,
        fileName: file.originalname,
        fileUrl,
        extractionStatus: extractionError ? "failed" : "success",
        extractionError: extractionError || null,
        metrics: {
          scope1: metrics.scope1,
          scope2: metrics.scope2,
          scope3: metrics.scope3,
          carbonFootprint,
          energy: metrics.energy,
          water: metrics.water,
          waste: metrics.waste,
          genderDiversity: metrics.genderDiversity,
          safetyIncidents: metrics.safetyIncidents,
          employeeWellbeing: metrics.employeeWellbeing,
          dataBreaches: metrics.dataBreaches,
          complaints: metrics.complaints,
        },
        scores: {
          environmental: scores.environmental,
          social: scores.social,
          governance: scores.governance,
          overall: scores.overall,
          grade: scores.grade,
        },
      },
    });

  } catch (error) {
    console.error("❌ Upload Error:", error);

    // Clean up local file if it still exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error("Failed to delete local file:", unlinkError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

/**
 * Get all KPIs for a specific report
 */
const getReportKpis = async (req, res) => {
  try {
    const { reportId } = req.params;

    const metrics = await getReportMetrics(reportId);

    // Format for frontend
    const formattedMetrics = {};
    Object.keys(metrics).forEach((key) => {
      formattedMetrics[key] = metrics[key].value;
    });

    return res.status(200).json({
      success: true,
      data: formattedMetrics,
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KPI values",
    });
  }
};

/**
 * Get all reports for a company with ESG scores
 * Supports pagination (?page=&limit=) and search (?search=)
 */
const getCompanyReports = async (req, res) => {
  try {
    const companyUserId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Get company ID
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const companyId = companyResult.rows[0].id;

    // Build search condition
    const searchCondition = search 
      ? `AND LOWER(r.file_name) LIKE LOWER($2)`
      : '';
    const searchParam = search ? `%${search}%` : null;

    // Count total matching reports
    const countParams = [companyId];
    if (search) countParams.push(searchParam);
    
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM reports r
       WHERE r.company_id = $1
       ${searchCondition}`,
      countParams
    );
    const totalReports = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalReports / limit);

    // Fetch reports with ESG scores (paginated)
    const queryParams = [companyId];
    let paramIndex = 2;
    
    if (search) {
      queryParams.push(searchParam);
      paramIndex++;
    }
    queryParams.push(limit);
    queryParams.push(offset);

    const reportsResult = await pool.query(
      `SELECT 
        r.id,
        r.file_name as name,
        r.file_type as type,
        r.file_url,
        r.created_at as uploaded_at,
        r.status,
        es.overall_score as esg_score,
        es.environmental,
        es.social,
        es.governance,
        es.grade
       FROM reports r
       LEFT JOIN esg_scores es ON r.id = es.report_id
       WHERE r.company_id = $1
       ${searchCondition}
       ORDER BY r.created_at DESC
       LIMIT $${search ? 3 : 2} OFFSET $${search ? 4 : 3}`,
      queryParams
    );

    const reports = reportsResult.rows.map((report) => ({
      id: report.id,
      name: report.name,
      type: report.type === "application/pdf" ? "PDF" : "CSV",
      fileUrl: report.file_url,
      date: report.uploaded_at,
      status: report.status,
      esgScore: report.esg_score,
      environmental: report.environmental,
      social: report.social,
      governance: report.governance,
      grade: report.grade,
    }));

    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};

/**
 * Get a single report with ALL metrics and scores
 * GET /reports/:id
 */
const getReportById = async (req, res) => {
  try {
    const companyUserId = req.user.userId;
    const reportId = req.params.id;

    // Get company ID
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const companyId = companyResult.rows[0].id;

    // Get report (ensure it belongs to this company)
    const reportResult = await pool.query(
      `SELECT id, file_name, file_type, file_url, status, created_at
       FROM reports
       WHERE id = $1 AND company_id = $2`,
      [reportId, companyId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const report = reportResult.rows[0];

    // Get ALL raw metrics (11 metrics)
    const metrics = await getReportMetrics(reportId);

    // Get ESG scores
    const scores = await getReportScores(reportId);

    // Get recommendations
    const recResult = await pool.query(
      "SELECT title, description, impact, effort FROM ai_recommendations WHERE report_id = $1",
      [reportId]
    );

    return res.json({
      success: true,
      data: {
        id: report.id,
        fileName: report.file_name,
        fileType: report.file_type === "application/pdf" ? "PDF" : "CSV",
        fileUrl: report.file_url,
        status: report.status,
        uploadedAt: report.created_at,
        metrics,
        scores,
        recommendations: recResult.rows,
      }
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
};

/**
 * Export report as PDF
 * GET /reports/:id/export
 */
const exportReport = async (req, res) => {
  try {
    const companyUserId = req.user.userId;
    const reportId = req.params.id;

    // Get company
    const companyResult = await pool.query(
      `SELECT c.id, c.name, c.industry, c.country 
       FROM companies c WHERE c.user_id = $1`,
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const company = companyResult.rows[0];

    // Get report
    const reportResult = await pool.query(
      `SELECT id, file_name, status, created_at
       FROM reports WHERE id = $1 AND company_id = $2`,
      [reportId, company.id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const report = reportResult.rows[0];

    // Get metrics and scores
    const metrics = await getReportMetrics(reportId);
    const scores = await getReportScores(reportId);

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ESG_Report_${reportId}.pdf"`);

    doc.pipe(res);

    // ---- PDF Content ----

    // Title
    doc.fontSize(24).fillColor('#059669')
       .text('EcoLens ESG Report', { align: 'center' });
    doc.moveDown(0.5);
    
    // Company info
    doc.fontSize(14).fillColor('#374151')
       .text(company.name || 'Company Report', { align: 'center' });
    doc.fontSize(10).fillColor('#6B7280')
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#D1D5DB');
    doc.moveDown(1);

    // Report Info
    doc.fontSize(16).fillColor('#111827').text('Report Information');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#374151');
    doc.text(`File: ${report.file_name}`);
    doc.text(`Uploaded: ${new Date(report.created_at).toLocaleDateString()}`);
    doc.text(`Status: ${report.status}`);
    if (company.industry) doc.text(`Industry: ${company.industry}`);
    if (company.country) doc.text(`Country: ${company.country}`);
    doc.moveDown(1);

    // ESG Scores
    if (scores) {
      doc.fontSize(16).fillColor('#111827').text('ESG Scores');
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#374151');
      doc.text(`Overall ESG Score: ${scores.overall ?? 'N/A'} (Grade: ${scores.grade || 'N/A'})`);
      doc.text(`Environmental: ${scores.environmental ?? 'N/A'}`);
      doc.text(`Social: ${scores.social ?? 'N/A'}`);
      doc.text(`Governance: ${scores.governance ?? 'N/A'}`);
      doc.moveDown(1);
    }

    // Raw Metrics
    doc.fontSize(16).fillColor('#111827').text('Extracted ESG Metrics');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#374151');

    const metricLabels = {
      SCOPE_1: 'Scope 1 Emissions',
      SCOPE_2: 'Scope 2 Emissions',
      SCOPE_3: 'Scope 3 Emissions',
      CARBON_EMISSIONS: 'Total Carbon Emissions',
      ENERGY_CONSUMPTION: 'Energy Consumption',
      WATER_USAGE: 'Water Usage',
      WASTE_GENERATED: 'Waste Generated',
      GENDER_DIVERSITY: 'Gender Diversity',
      SAFETY_INCIDENTS: 'Safety Incidents',
      EMPLOYEE_WELLBEING: 'Employee Wellbeing',
      DATA_BREACHES: 'Data Breaches',
      COMPLAINTS: 'Complaints'
    };

    Object.entries(metricLabels).forEach(([key, label]) => {
      const metric = metrics[key];
      const value = metric?.value;
      const unit = metric?.unit || '';
      doc.text(`${label}: ${value !== null && value !== undefined ? `${value} ${unit}`.trim() : 'Not Available'}`);
    });

    doc.moveDown(1);

    // Footer
    doc.fontSize(8).fillColor('#9CA3AF')
       .text('Generated by EcoLens - AI-Powered ESG Analytics', 50, doc.page.height - 50, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("Error exporting report:", error);
    return res.status(500).json({ success: false, message: "Failed to export report" });
  }
};

/**
 * Download original report file
 * GET /reports/:id/download
 */
const downloadReport = async (req, res) => {
  try {
    const companyUserId = req.user.userId;
    const reportId = req.params.id;

    // Get company ID
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const companyId = companyResult.rows[0].id;

    // Get report file URL
    const reportResult = await pool.query(
      `SELECT file_url, file_name 
       FROM reports WHERE id = $1 AND company_id = $2`,
      [reportId, companyId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const { file_url, file_name } = reportResult.rows[0];

    return res.json({
      success: true,
      data: {
        downloadUrl: file_url,
        fileName: file_name,
      }
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return res.status(500).json({ success: false, message: "Failed to download report" });
  }
};

module.exports = {
  uploadReport,
  getCompanyReports,
  getReportKpis,
  getReportById,
  exportReport,
  downloadReport,
};