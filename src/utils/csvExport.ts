export interface SurveyRatingRow {
  id: string;
  vendor_id: string | null;
  vendor_name: string;
  vendor_category: string | null;
  rating: number;
  comments: string | null;
  cost_kind: string | null;
  cost_amount: number | null;
  cost_period: string | null;
  cost_unit: string | null;
  cost_quantity: number | null;
  cost_notes: string | null;
  respondent_email: string | null;
  respondent_name: string | null;
  show_name: boolean | null;
  current_vendor: boolean | null;
  vendor_phone: string | null;
  created_at: string | null;
}

const escapeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

export const exportSurveyRatingsToCSV = (data: SurveyRatingRow[]): string => {
  const headers = [
    'ID',
    'Vendor ID',
    'Vendor Name',
    'Vendor Category',
    'Rating',
    'Comments',
    'Cost Kind',
    'Cost Amount',
    'Cost Period',
    'Cost Unit',
    'Cost Quantity',
    'Cost Notes',
    'Respondent Email',
    'Respondent Name',
    'Show Name',
    'Current Vendor',
    'Vendor Phone',
    'Created At'
  ];

  const csvRows = [headers.join(',')];

  data.forEach(row => {
    const values = [
      escapeCsvValue(row.id),
      escapeCsvValue(row.vendor_id),
      escapeCsvValue(row.vendor_name),
      escapeCsvValue(row.vendor_category),
      escapeCsvValue(row.rating),
      escapeCsvValue(row.comments),
      escapeCsvValue(row.cost_kind),
      escapeCsvValue(row.cost_amount),
      escapeCsvValue(row.cost_period),
      escapeCsvValue(row.cost_unit),
      escapeCsvValue(row.cost_quantity),
      escapeCsvValue(row.cost_notes),
      escapeCsvValue(row.respondent_email),
      escapeCsvValue(row.respondent_name),
      escapeCsvValue(row.show_name),
      escapeCsvValue(row.current_vendor),
      escapeCsvValue(row.vendor_phone),
      escapeCsvValue(row.created_at)
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
