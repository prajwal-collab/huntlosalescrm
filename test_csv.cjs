const Papa = require('papaparse');

const csv = `Contact Name,Email,Company Name,Designation,Contact LinkedIn
John Doe,john@example.com,Acme Corp,CEO,linkedin.com/in/johndoe
Jane Smith,jane@example.com,Beta Inc,CTO,linkedin.com/in/janesmith`;

const results = Papa.parse(csv, { header: true, skipEmptyLines: true });
const rows = results.data;

const mapping = {
  name: 'Contact Name',
  email: 'Email',
  company: 'Company Name',
  title: 'Designation',
  phone: '',
  linkedin: 'Contact LinkedIn'
};

const CONTACT_FIELDS = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email Address' },
  { key: 'company', label: 'Company Name' },
  { key: 'title', label: 'Job Title' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'linkedin', label: 'LinkedIn URL' }
];

const mappedData = rows.map(row => {
  const obj = {};
  CONTACT_FIELDS.forEach(field => {
    const csvHeader = mapping[field.key];
    if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
      obj[field.key] = row[csvHeader];
    }
  });
  return obj;
}).filter(obj => {
  if (!obj.name || obj.name.trim() === '') return false;
  return (obj.email && obj.email.trim() !== '') || (obj.phone && obj.phone.trim() !== '');
});

console.log(mappedData);
