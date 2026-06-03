const pool = require("../config/db");

// GET /news/overview — Dashboard stats
const getNewsOverview = async (req, res) => {
  try {
    // Total companies with news
    const totalResult = await pool.query(`
      SELECT COUNT(DISTINCT company_name)::int AS total
      FROM news_cache WHERE expires_at > NOW()
    `);

    // Sentiment counts
    const sentimentResult = await pool.query(`
      SELECT 
        sentiment_label,
        COUNT(DISTINCT company_name)::int AS company_count,
        COUNT(*)::int AS article_count
      FROM news_cache
      WHERE expires_at > NOW()
      GROUP BY sentiment_label
    `);

    const sentimentMap = {};
    let totalArticles = 0;
    sentimentResult.rows.forEach(row => {
      sentimentMap[row.sentiment_label] = {
        companies: row.company_count,
        articles: row.article_count
      };
      totalArticles += row.article_count;
    });

    // Most discussed company
    const mostDiscussed = await pool.query(`
      SELECT company_name, COUNT(*)::int AS count
      FROM news_cache WHERE expires_at > NOW()
      GROUP BY company_name
      ORDER BY count DESC LIMIT 1
    `);

    // Strongest positive
    const strongestPositive = await pool.query(`
      SELECT company_name, ROUND(AVG(sentiment_score), 4) AS avg_score
      FROM news_cache
      WHERE expires_at > NOW() AND sentiment_label = 'positive'
      GROUP BY company_name
      ORDER BY avg_score DESC LIMIT 1
    `);

    // Strongest negative
    const strongestNegative = await pool.query(`
      SELECT company_name, ROUND(AVG(sentiment_score), 4) AS avg_score
      FROM news_cache
      WHERE expires_at > NOW() AND sentiment_label = 'negative'
      GROUP BY company_name
      ORDER BY avg_score DESC LIMIT 1
    `);

    res.json({
      totalCompanies: totalResult.rows[0]?.total || 0,
      totalArticles,
      positiveCompanies: sentimentMap.positive?.companies || 0,
      negativeCompanies: sentimentMap.negative?.companies || 0,
      neutralCompanies: sentimentMap.neutral?.companies || 0,
      positiveArticles: sentimentMap.positive?.articles || 0,
      negativeArticles: sentimentMap.negative?.articles || 0,
      neutralArticles: sentimentMap.neutral?.articles || 0,
      mostDiscussed: mostDiscussed.rows[0]?.company_name || "N/A",
      mostDiscussedCount: mostDiscussed.rows[0]?.count || 0,
      strongestPositive: strongestPositive.rows[0]?.company_name || "N/A",
      strongestPositiveScore: parseFloat(strongestPositive.rows[0]?.avg_score) || 0,
      strongestNegative: strongestNegative.rows[0]?.company_name || "N/A",
      strongestNegativeScore: parseFloat(strongestNegative.rows[0]?.avg_score) || 0,
    });
  } catch (err) {
    console.error("Error fetching news overview:", err);
    res.status(500).json({ message: "Failed to fetch news overview", error: err.message });
  }
};

// GET /news/companies — Company table with sentiment
const getNewsCompanies = async (req, res) => {
  try {
    const { search = "", sentiment = "", sort = "news_count", order = "desc" } = req.query;

    // Allowed sort columns
    const sortMap = {
      company_name: "nc.company_name",
      sentiment_score: "avg_sentiment_score",
      news_count: "news_count",
      last_updated: "last_updated",
    };
    const sortCol = sortMap[sort] || "news_count";
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    let query = `
      SELECT 
        nc.company_name,
        COUNT(*)::int AS news_count,
        ROUND(AVG(nc.sentiment_score), 4) AS avg_sentiment_score,
        MODE() WITHIN GROUP (ORDER BY nc.sentiment_label) AS dominant_sentiment,
        COUNT(*) FILTER (WHERE nc.sentiment_label = 'positive')::int AS positive_count,
        COUNT(*) FILTER (WHERE nc.sentiment_label = 'negative')::int AS negative_count,
        COUNT(*) FILTER (WHERE nc.sentiment_label = 'neutral')::int AS neutral_count,
        MAX(nc.created_at) AS last_updated
      FROM news_cache nc
      WHERE nc.expires_at > NOW()
    `;

    const values = [];

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      query += ` AND nc.company_name ILIKE $${values.length}`;
    }

    if (sentiment && sentiment.trim() && sentiment !== "all") {
      values.push(sentiment.trim().toLowerCase());
      query += ` AND nc.sentiment_label = $${values.length}`;
    }

    query += ` GROUP BY nc.company_name`;
    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const result = await pool.query(query, values);

    // Try to join EIC scores from esg_scores table
    const companiesWithScores = await Promise.all(
      result.rows.map(async (row) => {
        let eicScore = null;
        try {
          const scoreResult = await pool.query(`
            SELECT es.overall_score
            FROM companies c
            JOIN reports r ON r.company_id = c.id
            JOIN esg_scores es ON es.report_id = r.id
            WHERE LOWER(c.name) = LOWER($1)
            ORDER BY r.created_at DESC LIMIT 1
          `, [row.company_name]);
          if (scoreResult.rows.length > 0) {
            eicScore = parseFloat(scoreResult.rows[0].overall_score);
          }
        } catch (e) {
          // EIC score not available — that's fine
        }

        return {
          companyName: row.company_name,
          newsCount: row.news_count,
          avgSentimentScore: parseFloat(row.avg_sentiment_score) || 0,
          dominantSentiment: row.dominant_sentiment || "neutral",
          positiveCount: row.positive_count,
          negativeCount: row.negative_count,
          neutralCount: row.neutral_count,
          eicScore,
          lastUpdated: row.last_updated,
        };
      })
    );

    res.json(companiesWithScores);
  } catch (err) {
    console.error("Error fetching news companies:", err);
    res.status(500).json({ message: "Failed to fetch news companies", error: err.message });
  }
};

// GET /news/top-alerts — Top negative sentiment companies
const getNewsTopAlerts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        company_name,
        COUNT(*)::int AS negative_articles,
        ROUND(AVG(sentiment_score), 4) AS avg_negative_score,
        MAX(headline) AS sample_headline
      FROM news_cache
      WHERE expires_at > NOW() AND sentiment_label = 'negative'
      GROUP BY company_name
      ORDER BY negative_articles DESC, avg_negative_score DESC
      LIMIT 5
    `);

    const alerts = result.rows.map((row) => ({
      companyName: row.company_name,
      negativeArticles: row.negative_articles,
      avgNegativeScore: parseFloat(row.avg_negative_score) || 0,
      sampleHeadline: row.sample_headline,
      severity: row.negative_articles >= 5 ? "high" : row.negative_articles >= 3 ? "medium" : "low",
    }));

    res.json(alerts);
  } catch (err) {
    console.error("Error fetching top alerts:", err);
    res.status(500).json({ message: "Failed to fetch top alerts", error: err.message });
  }
};

// GET /news/company/:name — All news for a specific company
const getCompanyNews = async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.name);

    const result = await pool.query(`
      SELECT 
        id, headline, url, source, sentiment_label,
        sentiment_score, confidence, summary, published_at, created_at
      FROM news_cache
      WHERE company_name ILIKE $1 AND expires_at > NOW()
      ORDER BY published_at DESC
    `, [companyName]);

    // Get company summary stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE sentiment_label = 'positive')::int AS positive,
        COUNT(*) FILTER (WHERE sentiment_label = 'negative')::int AS negative,
        COUNT(*) FILTER (WHERE sentiment_label = 'neutral')::int AS neutral_count,
        ROUND(AVG(sentiment_score), 4) AS avg_score,
        MODE() WITHIN GROUP (ORDER BY sentiment_label) AS dominant
      FROM news_cache
      WHERE company_name ILIKE $1 AND expires_at > NOW()
    `, [companyName]);

    // Try to get EIC score
    let eicScore = null;
    try {
      const eicResult = await pool.query(`
        SELECT es.overall_score
        FROM companies c
        JOIN reports r ON r.company_id = c.id
        JOIN esg_scores es ON es.report_id = r.id
        WHERE LOWER(c.name) = LOWER($1)
        ORDER BY r.created_at DESC LIMIT 1
      `, [companyName]);
      if (eicResult.rows.length > 0) {
        eicScore = parseFloat(eicResult.rows[0].overall_score);
      }
    } catch (e) { /* EIC not available */ }

    const stats = statsResult.rows[0] || {};

    res.json({
      companyName,
      eicScore,
      totalArticles: stats.total || 0,
      positiveCount: stats.positive || 0,
      negativeCount: stats.negative || 0,
      neutralCount: stats.neutral_count || 0,
      avgSentimentScore: parseFloat(stats.avg_score) || 0,
      dominantSentiment: stats.dominant || "neutral",
      articles: result.rows.map((row) => ({
        id: row.id,
        headline: row.headline,
        url: row.url,
        source: row.source,
        sentimentLabel: row.sentiment_label,
        sentimentScore: parseFloat(row.sentiment_score) || 0,
        confidence: parseFloat(row.confidence) || 0,
        summary: row.summary,
        publishedAt: row.published_at,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error("Error fetching company news:", err);
    res.status(500).json({ message: "Failed to fetch company news", error: err.message });
  }
};

// GET /news/company/:name/summary — Investor insight for a company
const getCompanyNewsSummary = async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.name);

    const result = await pool.query(`
      SELECT DISTINCT ON (company_name) summary
      FROM news_cache
      WHERE company_name ILIKE $1 AND expires_at > NOW()
      ORDER BY company_name, created_at DESC
      LIMIT 1
    `, [companyName]);

    res.json({
      companyName,
      summary: result.rows[0]?.summary || "No recent analysis available for this company.",
    });
  } catch (err) {
    console.error("Error fetching company summary:", err);
    res.status(500).json({ message: "Failed to fetch company summary", error: err.message });
  }
};

module.exports = {
  getNewsOverview,
  getNewsCompanies,
  getNewsTopAlerts,
  getCompanyNews,
  getCompanyNewsSummary,
};
