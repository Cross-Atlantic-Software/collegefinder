/**
 * Diagram image generation (Gemini image model) and S3 upload; placeholder fallbacks.
 */
const { IMAGE_GENERATION_MODEL, DIAGRAM_IMAGE_URLS, getUploadToS3 } = require('./config');
const { getGoogleApiKey } = require('./env');

/**
 * Generate a diagram image buffer using Gemini image-generation model (REST API).
 * @param {string} questionText - The question text to illustrate
 * @param {string} diagramType - e.g. circuit, free_body, ray_diagram
 * @returns {Promise<{ buffer: Buffer, mimeType: string } | null>}
 */
async function generateDiagramImageBuffer(questionText, diagramType) {
  const apiKey = getGoogleApiKey();
  if (!apiKey) return null;
  const prompt = `Generate a single clear, educational diagram or figure suitable for this exam question. Style: clean line diagram, labels where helpful. Do not add extra text explanation.

Question: ${questionText.substring(0, 1500)}

Output only the diagram image.`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GENERATION_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.6,
      maxOutputTokens: 4096,
    },
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('⚠️  Diagram image API error:', res.status, errText?.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        return { buffer, mimeType };
      }
    }
    return null;
  } catch (err) {
    console.warn('⚠️  Diagram image generation failed:', err.message);
    return null;
  }
}

/**
 * Generate diagram image and upload to S3. Returns S3 URL or null.
 */
async function generateAndUploadDiagram(questionText, diagramType) {
  const result = await generateDiagramImageBuffer(questionText, diagramType);
  if (!result || !result.buffer || result.buffer.length === 0) return null;
  const uploadToS3 = getUploadToS3();
  if (!uploadToS3) {
    console.warn('⚠️  S3 upload not available; diagram image not saved');
    return null;
  }
  const ext = (result.mimeType === 'image/png') ? 'png' : 'jpg';
  const fileName = `question-diagram-${Date.now()}.${ext}`;
  try {
    const url = await uploadToS3(result.buffer, fileName, 'question_diagrams');
    console.log('📐 Diagram image uploaded to S3:', url);
    return url;
  } catch (err) {
    console.warn('⚠️  S3 upload for diagram failed:', err.message);
    return null;
  }
}

/**
 * If processedData has diagram_type, generate diagram image (Gemini), upload to S3, set image_url; else use placeholder.
 * @param {Object} processedData - Parsed question data (mutated in place)
 */
async function setDiagramImageUrl(processedData) {
  if (!processedData.diagram_type || typeof processedData.diagram_type !== 'string') return;
  const key = processedData.diagram_type.trim().toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  const questionText = processedData.question_text || '';
  if (!questionText) {
    processedData.image_url = DIAGRAM_IMAGE_URLS[key] || null;
    return;
  }
  const url = await generateAndUploadDiagram(questionText, processedData.diagram_type);
  processedData.image_url = url || DIAGRAM_IMAGE_URLS[key] || null;
  if (url) console.log('📐 Diagram question: image_url set from generated image');
  else console.log('📐 Diagram question: using placeholder for', processedData.diagram_type);
}

module.exports = {
  generateDiagramImageBuffer,
  generateAndUploadDiagram,
  setDiagramImageUrl,
};
