from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import tempfile
from werkzeug.utils import secure_filename
import logging
import sys

# Import the pipeline directly instead of running as subprocess
from evaluate_on_pdf import PDFEvaluationPipeline

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Initialize the pipeline once at startup (models loaded once)
logger.info("Loading ESG extraction pipeline...")
pipeline = PDFEvaluationPipeline()
logger.info("ESG extraction pipeline loaded successfully")

# ============================================================================
# TARGET METRICS - Only these 11 metrics are required
# ============================================================================
REQUIRED_METRICS = {
    'SCOPE_1',              # Environmental
    'SCOPE_2',              # Environmental
    'SCOPE_3',              # Environmental
    'ENERGY_CONSUMPTION',   # Environmental
    'WATER_USAGE',          # Environmental
    'WASTE_GENERATED',      # Environmental
    'GENDER_DIVERSITY',     # Social
    'SAFETY_INCIDENTS',     # Social
    'EMPLOYEE_WELLBEING',   # Social
    'DATA_BREACHES',        # Governance
    'COMPLAINTS',           # Governance
}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_clean_metrics(mp_json):
    """
    Extract only the 11 required metrics from the master-prompt JSON.
    
    Args:
        mp_json: Master-prompt output dictionary with format:
                 {metric_name: {value, unit, confidence, ...}}
    
    Returns:
        dict: Clean metrics with only the 11 required metrics in format:
              {metric_name: {value, unit}}
    """
    clean_metrics = {}
    
    for metric_name in REQUIRED_METRICS:
        if metric_name in mp_json:
            metric_data = mp_json[metric_name]
            clean_metrics[metric_name] = {
                'value': metric_data.get('value'),
                'unit': metric_data.get('unit', '')
            }
            logger.info(f"✓ Extracted {metric_name}: {metric_data.get('value')} {metric_data.get('unit', '')}")
        else:
            # Metric not found - leave as None (will be handled by backend as NULL)
            logger.warning(f"✗ Missing {metric_name}")
    
    logger.info(f"Extracted {len(clean_metrics)}/{len(REQUIRED_METRICS)} required metrics")
    return clean_metrics


def extract_esg_metrics(pdf_path):
    """
    Run the ESG extraction pipeline and return only the 11 required metrics.
    
    Args:
        pdf_path: Path to the uploaded PDF file
        
    Returns:
        dict: Clean metrics dictionary with only the 11 required metrics
    """
    try:
        logger.info(f"Running ESG extraction pipeline on {pdf_path}")
        
        # Run pipeline directly (no subprocess, no temp files)
        results = pipeline.process_pdf(pdf_path)
        
        # Get the master-prompt JSON
        mp_json = results.get('master_prompt_output', {})
        
        logger.info(f"Pipeline extracted {len(mp_json)} total metrics")
        logger.debug(f"All extracted metrics: {list(mp_json.keys())}")
        
        # Extract only the 11 required metrics
        clean_metrics = extract_clean_metrics(mp_json)
        
        return clean_metrics
        
    except Exception as e:
        logger.error(f"Error extracting ESG metrics: {str(e)}")
        raise


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ESG Extraction API',
        'required_metrics': list(REQUIRED_METRICS)
    }), 200


@app.route('/extract', methods=['POST'])
def extract_esg():
    """
    Main endpoint for ESG metric extraction
    
    Expected: multipart/form-data with 'file' field containing PDF
    Returns: JSON with exactly 11 ESG metrics
    """
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            logger.warning("No file provided in request")
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file has a filename
        if file.filename == '':
            logger.warning("Empty filename provided")
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        # Check if file extension is allowed
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({
                'status': 'error',
                'message': 'Only PDF files are allowed'
            }), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        file_path = temp_file.name
        temp_file.close()
        
        file.save(file_path)
        logger.info(f"File saved temporarily at {file_path}")
        
        try:
            # Extract only the 11 required ESG metrics
            metrics = extract_esg_metrics(file_path)
            
            # Clean up temporary PDF file
            os.unlink(file_path)
            logger.info("Temporary file deleted")
            
            # Log what we're sending back
            logger.info("=" * 70)
            logger.info("SENDING TO NODE.JS BACKEND:")
            logger.info("=" * 70)
            for metric_name, metric_data in metrics.items():
                logger.info(f"  {metric_name}: {metric_data['value']} {metric_data.get('unit', '')}")
            logger.info("=" * 70)
            
            # Return success response with clean metrics
            return jsonify({
                'status': 'success',
                'message': 'ESG metrics extracted successfully',
                'metrics': metrics
            }), 200
            
        except Exception as e:
            # Clean up temporary file on error
            if os.path.exists(file_path):
                os.unlink(file_path)
            raise e
            
    except Exception as e:
        logger.error(f"Error in extract endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Extraction failed: {str(e)}'
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size too large errors"""
    return jsonify({
        'status': 'error',
        'message': 'File size exceeds 50MB limit'
    }), 413


if __name__ == '__main__':
    logger.info("=" * 70)
    logger.info("Flask ESG Extraction API v2.0 - CLEAN METRICS")
    logger.info("=" * 70)
    logger.info(f"Required metrics: {len(REQUIRED_METRICS)}")
    for metric in sorted(REQUIRED_METRICS):
        logger.info(f"  - {metric}")
    logger.info("=" * 70)
    logger.info("Server will run on http://localhost:5000")
    logger.info("=" * 70)
    app.run(host='0.0.0.0', port=5000, debug=True)