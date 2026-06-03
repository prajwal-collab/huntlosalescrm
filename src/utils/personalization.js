// ============================================
// HUNTLO SALES OS — PERSONALIZATION ENGINE
// ============================================

export function parseTemplate(templateString, leadData, senderData = {}) {
  if (!templateString) return '';

  let parsed = templateString;

  const fallback = (val) => val || '';

  // Extract variables
  const firstName = leadData.name ? leadData.name.split(' ')[0] : fallback(leadData.contact_name?.split(' ')[0]);
  const lastName = leadData.name ? leadData.name.split(' ').slice(1).join(' ') : fallback(leadData.contact_name?.split(' ').slice(1).join(' '));
  const company = fallback(leadData.company_name);
  const title = fallback(leadData.designation);
  const email = fallback(leadData.email);
  const phone = fallback(leadData.whatsapp); // Or phone if it exists
  
  const senderFirstName = fallback(senderData.name?.split(' ')[0]);

  // Standard mappings based on the UI screenshot and general standards
  const variables = {
    '{{first_name}}': firstName,
    '{{FirstName}}': firstName,
    '{{candidate_name}}': leadData.name || leadData.contact_name || '',
    '{{candidate_email}}': email,
    '{{candidate_phone}}': phone,
    '{{CurrentCompany}}': company,
    '{{JobTitle}}': title,
    '{{SenderFirstName}}': senderFirstName,
    '{{company_name}}': company
  };

  // Replace each tag
  Object.keys(variables).forEach(tag => {
    // Escape the tag for regex injection
    const escapedTag = tag.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(escapedTag, 'g');
    parsed = parsed.replace(regex, variables[tag]);
  });

  return parsed;
}
