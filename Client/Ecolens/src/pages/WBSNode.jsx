// App.js - Paste into src/App.js in Create React App and run `npm start`
// Font: Add <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet"> to index.html

import React, { useState, useRef } from 'react';

const WBSNode = ({ node, x, y, level, width, height }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colors = {
    0: { bg: '#3BB273', text: '#FFFFFF', border: '#2E7D32' },
    1: { bg: '#2E7D32', text: '#FFFFFF', border: '#1B5E20' },
    2: { bg: '#A5D6A7', text: '#2B2B2B', border: '#81C784' }
  };
  
  const color = colors[level] || colors[2];
  const fontSize = level === 0 ? 16 : level === 1 ? 14 : 13;
  const padding = 15;
  
  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill={isHovered ? '#2E7D32' : color.bg}
        stroke={color.border}
        strokeWidth={2}
        filter="url(#shadow)"
        style={{ transition: 'all 0.2s ease' }}
      />
      <foreignObject
        x={x - width / 2 + padding}
        y={y + padding}
        width={width - padding * 2}
        height={height - padding * 2}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: isHovered ? '#FFFFFF' : color.text,
            fontSize: `${fontSize}px`,
            fontWeight: level === 0 ? 700 : 600,
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center',
            lineHeight: '1.4',
            transition: 'color 0.2s ease'
          }}
        >
          {node.title}
        </div>
      </foreignObject>
    </g>
  );
};

const WBSDiagram = () => {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const svgRef = useRef(null);
  
  const wbsData = {
    title: 'EcoLens – An AI-Powered ESG & Carbon Footprint Analyzer',
    children: [
      {
        title: 'Project Planning & Requirement Analysis',
        children: [
          { title: 'Define ESG & KPIs (CO2, Energy, Water, Waste)' },
          { title: 'Identify Scope 1/2/3' },
          { title: 'Finalize tech stack' },
          { title: 'Prepare datasets & architecture' }
        ]
      },
      {
        title: 'Data Collection & Preprocessing',
        children: [
          { title: 'File upload interface (PDF/CSV) & storage' },
          { title: 'NLP & regex extraction of KPIs' },
          { title: 'KPI completeness check' },
          { title: 'Proxy estimator for missing values' }
        ]
      },
      {
        title: 'AI & NLP Engine Development',
        children: [
          { title: 'Build text-processing pipeline (tokenization, NER)' },
          { title: 'Sentiment analysis (Environmental, Social, Governance)' },
          { title: 'News & sentiment datastore' }
        ]
      },
      {
        title: 'ESG Scoring & Analytics System',
        children: [
          { title: 'Baseline KPI computation' },
          { title: 'Scope-wise emission calculations (1/2/3)' },
          { title: 'Versioned KPI store' },
          { title: 'Scoring engine & normalization' }
        ]
      },
      {
        title: 'Recommendation Engine',
        children: [
          { title: 'Carbon reduction suggestions (greener suppliers, route optimization)' },
          { title: 'Forecasting using historical trends' },
          { title: 'Action prioritization (short / long term)' }
        ]
      },
      {
        title: 'Web Application Development (Frontend & Backend)',
        children: [
          { title: 'Frontend: Homepage, Company Portal (upload & dashboard), Investor Portal' },
          { title: 'Backend: APIs for upload, NLP, scoring, recommendations' },
          { title: 'API Layer & DB integration' }
        ]
      }
    ]
  };
  
  const downloadPNG = () => {
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    
    const fontStyle = `<style>@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');</style>`;
    svgString = svgString.replace('<svg', `<svg>${fontStyle}<g>`).replace('</svg>', '</g></svg>');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = svg.viewBox.baseVal.width;
      canvas.height = svg.viewBox.baseVal.height;
      ctx.fillStyle = '#F8FAF8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'ecolens-wbs.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };
  
  const renderTree = (node, x, y, level) => {
    const elements = [];
    
    // Node dimensions
    const level0Width = 500;
    const level0Height = 80;
    const level1Width = 400;
    const level1Height = 70;
    const level2Width = 380;
    const level2Height = 65;
    
    const nodeWidth = level === 0 ? level0Width : level === 1 ? level1Width : level2Width;
    const nodeHeight = level === 0 ? level0Height : level === 1 ? level1Height : level2Height;
    
    // Draw current node
    elements.push(
      <WBSNode
        key={`node-${x}-${y}-${level}`}
        node={node}
        x={x}
        y={y}
        level={level}
        width={nodeWidth}
        height={nodeHeight}
      />
    );
    
    // Draw children
    if (node.children && node.children.length > 0) {
      if (level === 0) {
        // Level 1 nodes: arrange in 2 columns
        const cols = 2;
        const rows = Math.ceil(node.children.length / cols);
        const horizontalSpacing = 550;
        const verticalSpacing = 450;
        const startX = x - (horizontalSpacing * (cols - 1)) / 2;
        const childY = y + nodeHeight + 120;
        
        node.children.forEach((child, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const childX = startX + col * horizontalSpacing;
          const childYPos = childY + row * verticalSpacing;
          
          // Draw connector line
          const connectorStartY = y + nodeHeight;
          const connectorEndY = childYPos;
          const midY = connectorStartY + 60;
          
          elements.push(
            <path
              key={`line-${i}`}
              d={`M ${x} ${connectorStartY} L ${x} ${midY} L ${childX} ${midY} L ${childX} ${connectorEndY}`}
              stroke="#2E7D32"
              strokeWidth={3}
              fill="none"
            />
          );
          
          elements.push(...renderTree(child, childX, childYPos, level + 1));
        });
      } else if (level === 1) {
        // Level 2 nodes: arrange vertically
        const verticalSpacing = 85;
        const childY = y + nodeHeight + 100;
        
        node.children.forEach((child, i) => {
          const childYPos = childY + i * verticalSpacing;
          
          // Draw straight connector line
          elements.push(
            <line
              key={`line-${x}-${i}`}
              x1={x}
              y1={y + nodeHeight}
              x2={x}
              y2={childYPos}
              stroke="#2E7D32"
              strokeWidth={3}
            />
          );
          
          elements.push(...renderTree(child, x, childYPos, level + 1));
        });
      }
    }
    
    return elements;
  };
  
  const svgWidth = 2400;
  const svgHeight = 3800;
  
  return (
    <div style={{ 
      fontFamily: 'Poppins, sans-serif',
      backgroundColor: '#F8FAF8',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{
          color: '#2E7D32',
          fontSize: '36px',
          fontWeight: 700,
          margin: '0 0 10px 0'
        }}>
          EcoLens — Work Breakdown Structure
        </h1>
        <p style={{
          color: '#2B2B2B',
          fontSize: '14px',
          margin: 0
        }}>
          AI-Powered ESG & Carbon Footprint Analysis Platform
        </p>
      </div>
      
      {/* Control Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3BB273',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Zoom +
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2E7D32',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Zoom -
        </button>
        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#A5D6A7',
            color: '#2B2B2B',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
        <button
          onClick={downloadPNG}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3BB273',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Download PNG
        </button>
      </div>
      
      {/* SVG Container */}
      <div style={{
        overflow: 'auto',
        border: '2px solid #A5D6A7',
        borderRadius: '8px',
        backgroundColor: 'white',
        maxHeight: '80vh'
      }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: '100%',
            height: 'auto',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease'
          }}
        >
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.25" />
            </filter>
            {showGrid && (
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E0E0E0" strokeWidth="1" opacity="0.3" />
              </pattern>
            )}
          </defs>
          
          {showGrid && (
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />
          )}
          
          <rect width={svgWidth} height={svgHeight} fill="#F8FAF8" opacity={showGrid ? 0 : 1} />
          
          {renderTree(wbsData, svgWidth / 2, 80, 0)}
        </svg>
      </div>
      
      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #A5D6A7'
      }}>
        <p style={{
          color: '#2B2B2B',
          fontSize: '12px',
          margin: 0
        }}>
          <strong style={{ color: '#2E7D32' }}>EcoLens</strong> — Empowering sustainable business decisions through AI-driven ESG analytics
        </p>
      </div>
    </div>
  );
};

export default WBSDiagram;