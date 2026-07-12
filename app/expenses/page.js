'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { LazyExpenseDoughnut, LazyExpenseBarChart } from '@/components/ui/LazyChart';
import { format, parseISO } from 'date-fns';
import {
  BsCurrencyRupee, BsPlus, BsXLg, BsTrash,
  BsPeopleFill, BsPersonFill, BsCalendar3
} from 'react-icons/bs';
import '@/styles/expenses.css';
import LazySelect from '@/components/ui/LazySelect';
import ModernTable from '@/components/ui/ModernTable';

const CATEGORIES = [
  { value: 'food', label: '🍛 Food', color: '#FF3B7F' },
  { value: 'travel', label: '✈️ Travel', color: '#00CFFF' },
  { value: 'shopping', label: '🛍️ Shopping', color: '#FFB830' },
  { value: 'medical', label: '🏥 Medical', color: '#10D48E' },
  { value: 'entertainment', label: '🎬 Entertainment', color: '#7B2FFF' },
  { value: 'utilities', label: '💡 Utilities', color: '#F97316' },
  { value: 'contribution', label: '💰 Monthly Contribution', color: '#C6F135' },
  { value: 'other', label: '📦 Other', color: '#94A3B8' },
];

// Will be populated with real users from API
const BROTHERS = [
  { value: 'all', label: 'All Members' },
];

// Will be populated with real users from API
const BROTHERS_ORIGINAL = [];

const MONTHLY_AMOUNT = 300;



const getCategoryInfo = (val) => CATEGORIES.find((c) => c.value === val) || CATEGORIES[CATEGORIES.length - 1];

// Define constants before component
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function ExpensesPage() {
  const supabase = getSupabaseClient();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', description: '', is_split: false });
  const [contributions, setContributions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [groupBy, setGroupBy] = useState('month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrother, setFilterBrother] = useState([{ value: 'all', label: 'All Brothers' }]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonthDropdown, setSelectedMonthDropdown] = useState([{ value: (new Date().getMonth() + 1).toString(), label: MONTHS[new Date().getMonth()].label }]);
  const [monthlyAmounts, setMonthlyAmounts] = useState({});
  const [showAmountSettings, setShowAmountSettings] = useState(false);
  const [newMonthlyAmount, setNewMonthlyAmount] = useState(MONTHLY_AMOUNT);
  const [settingsYear, setSettingsYear] = useState(selectedYear);
  const [tempAmount, setTempAmount] = useState(MONTHLY_AMOUNT);

  const GROUP_BY_OPTIONS = [
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
  ];

  // Generate year options dynamically
  const getCurrentYear = () => new Date().getFullYear();
  const YEAR_OPTIONS = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: getCurrentYear() - 2020 + 1 }, (_, i) => ({
      value: (2020 + i).toString(),
      label: (2020 + i).toString()
    })).reverse()
  ];

  const MONTH_OPTIONS = [
    { value: 'all', label: 'All Months' },
    ...MONTHS
  ];

  const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ value: c.value, label: c.label }));

  // Common styles for single-select dropdowns
  const singleSelectStyles = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border)',
      borderRadius: '4px',
      fontSize: '0.85rem',
      minHeight: '36px',
      '&:hover': {
        borderColor: 'var(--border)',
      },
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '4px',
      zIndex: 9999,
    }),
    option: (baseStyles, state) => ({
      ...baseStyles,
      backgroundColor: state.isFocused ? 'var(--bg-hover)' : 'var(--bg-card)',
      color: 'var(--text-primary)',
      '&:hover': {
        backgroundColor: 'var(--bg-hover)',
      },
    }),
    placeholder: (baseStyles) => ({
      ...baseStyles,
      color: 'var(--text-secondary)',
    }),
    singleValue: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: 'var(--accent-purple)',
      color: 'white',
      borderRadius: '4px',
      padding: '2px 8px',
      fontSize: '0.8rem',
      fontWeight: 500,
    }),
  };

  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Parallel fetch requests
      await Promise.all([
        fetchExpenses(),
        fetchMembers(),
        fetchMonthlyAmounts(),
        fetchContributions()
      ]);
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [selectedYear, selectedMonthDropdown]);

  useEffect(() => {
    fetchMonthlyAmounts();
  }, [selectedYear]);

  useEffect(() => {
    setSettingsYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    setTempAmount(monthlyAmounts[settingsYear] || MONTHLY_AMOUNT);
  }, [settingsYear, monthlyAmounts]);

  async function fetchExpenses() {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }

  // Function to get monthly amount for a specific month (now uses yearly amount)
  const getMonthlyAmount = async (month) => {
    try {
      const year = month.split('-')[0];
      const yearlyAmount = monthlyAmounts[year] || MONTHLY_AMOUNT;
      return yearlyAmount;
    } catch (error) {
      console.error('Error getting monthly amount:', error);
      return MONTHLY_AMOUNT;
    }
  };

  // Function to fetch all yearly amounts
  const fetchMonthlyAmounts = async () => {
    try {
      const { data, error } = await supabase
        .from('yearly_amounts')
        .select('year, amount');
      
      if (error) {
        console.log('Yearly amounts table not found, using defaults:', error.message);
        setMonthlyAmounts({});
        return;
      }
      
      const amounts = {};
      data.forEach(item => {
        amounts[item.year] = item.amount;
      });
      setMonthlyAmounts(amounts);
    } catch (error) {
      console.error('Error fetching yearly amounts:', error);
      setMonthlyAmounts({});
    }
  };

  // Function to update yearly amount
  const updateYearlyAmount = async (year, amount) => {
    try {
      const { data, error } = await supabase
        .from('yearly_amounts')
        .upsert({ year, amount }, { onConflict: 'year' });
      
      if (error) {
        console.error('Error updating yearly amount:', error);
        toast.error('Error updating yearly amount: ' + error.message);
      } else {
        toast.success(`Updated monthly amount for ${year}`);
        console.log('Successfully updated yearly amount:', data);
        fetchMonthlyAmounts(); // Refresh the amounts
      }
    } catch (error) {
      console.error('Error in updateYearlyAmount:', error);
      toast.error('Error: ' + error.message);
    }
  };

  async function fetchMembers() {
    try {
      console.log('Fetching assigned members for expense tracker...');
      
      // Fetch expense assignments via API
      const response = await fetch('/api/admin/expense-assignments');
      console.log('Assignments API response status:', response.status);
      
      if (response.ok) {
        const { assignments } = await response.json();
        console.log('Assignments fetched:', assignments?.length || 0);
        
        // Transform assignments data for expense tracker
        const assignedMembers = assignments.map(assignment => {
          const user = assignment.user;
          return {
            id: assignment.user_id,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'No name',
            email: user?.email || 'No email',
            created_at: assignment.created_at,
            hasUserDetails: !!user
          };
        });
        
        console.log('Assigned members from API:', assignedMembers);
        console.log('Members with user details:', assignedMembers.filter(m => m.hasUserDetails).length);
        
        console.log('Assigned members processed:', assignedMembers);
        setMembers(assignedMembers);
        
        // Update BROTHERS arrays with assigned member data
        BROTHERS.length = 1; // Keep only "All Members" option
        BROTHERS_ORIGINAL.length = 0; // Clear hardcoded brothers
        
        assignedMembers.forEach(member => {
          BROTHERS.push({
            value: member.id,
            label: member.name
          });
          
          BROTHERS_ORIGINAL.push({
            id: member.id,
            name: member.name
          });
        });
        
        console.log('BROTHERS updated:', BROTHERS.length - 1, 'assigned members added');
        console.log('BROTHERS_ORIGINAL updated:', BROTHERS_ORIGINAL.length, 'assigned members added');
      } else {
        console.log('Assignments API failed, using fallback');
        // Fallback to empty if no assignments
        BROTHERS.length = 1;
        BROTHERS_ORIGINAL.length = 0;
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to fetch assigned members:', err);
      // Fallback to empty if error
      console.log('Using empty fallback - no members assigned');
      BROTHERS.length = 1;
      BROTHERS_ORIGINAL.length = 0;
      setMembers([]);
      toast.info('No members assigned to expense tracking. Please contact admin to assign members.');
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      ...form,
      amount: parseFloat(form.amount),
      paid_by: user?.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Expense added!');
    setShowAdd(false);
    setForm({ title: '', amount: '', category: 'food', description: '', is_split: false });
    fetchExpenses();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    toast.success('Expense deleted');
    fetchExpenses();
  }

  async function fetchContributions() {
    // Get selected months from dropdown
    const selectedMonthValues = selectedMonthDropdown.map(m => m.value);
    
    if (selectedYear === 'all') {
      // Fetch all contributions
      const { data } = await supabase
        .from('contributions')
        .select('*');
      setContributions(data || []);
    } else if (selectedMonthValues.includes('all')) {
      // Fetch all months in the selected year
      const monthsToFetch = MONTHS.map(m => `${selectedYear}-${String(m.value).padStart(2, '0')}`);
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .in('month', monthsToFetch);
      setContributions(data || []);
    } else {
      // Get months in YYYY-MM format for selected year
      const monthsToFetch = selectedMonthValues.map(monthValue => {
        const monthStr = String(monthValue);
        const month = monthStr.length <= 2 ? monthStr : monthStr.split('-')[1];
        return `${selectedYear}-${month.padStart(2, '0')}`;
      });
      
      // Fetch contributions for selected months
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .in('month', monthsToFetch);
      setContributions(data || []);
    }
  }

  async function handleAddContribution(brotherId) {
    try {
      console.log('Mark Paid clicked for brother:', brotherId);
      
      // Get selected months from dropdown
      const selectedMonthValues = selectedMonthDropdown.map(m => m.value);
      
      if (selectedMonthValues.includes('all')) {
        toast.error('Please select specific months');
        return;
      }

      // Create month strings in YYYY-MM format
      const monthsToInsert = selectedMonthValues.map(monthValue => {
        // Ensure monthValue is a string
        const monthStr = String(monthValue);
        const month = monthStr.length <= 2 ? monthStr : monthStr.split('-')[1];
        return `${selectedYear}-${month.padStart(2, '0')}`;
      });

      console.log('Months to insert:', monthsToInsert);

      // Get monthly amounts for each month (could be different)
      const contributionsToInsert = [];
      
      for (const monthValue of monthsToInsert) {
        const monthlyAmount = await getMonthlyAmount(monthValue);
        
        contributionsToInsert.push({
          brother_id: brotherId, // UUID from assigned users
          amount: monthlyAmount,
          month: monthValue,
          paid_by: user?.id,
        });
      }

      console.log('Data to insert:', contributionsToInsert);

      const { data, error } = await supabase.from('contributions').upsert(contributionsToInsert, { onConflict: 'brother_id,month' });
      
      if (error) {
        toast.error('Backend error: ' + error.message);
        console.error('Backend error details:', error);
      } else {
        toast.success(`Successfully marked paid for ${monthsToInsert.length} month(s)!`);
        console.log('Success! Inserted data:', data);
        fetchContributions();
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
      console.error('Catch error:', err);
    }
  }

  async function exportToPDF() {
    try {
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      
      // Use landscape orientation for better table fit
      const doc = new jsPDF({ orientation: 'landscape' });

      // Modern header with colors
      doc.setFillColor(16, 185, 129); // Green color
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text('Mhalkari Family', 14, 15);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text('Monthly Contributions Report', 14, 23);
      
      // Year and date info
      doc.setFontSize(10);
      doc.text(`Year: ${selectedYear === 'all' ? 'All Years' : selectedYear}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 200, 30);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      
      const months = getSelectedMonths();
      const monthLabels = months.map(month => {
        const [year, monthNum] = month.split('-').map(Number);
        const monthObj = MONTHS.find(m => m.value === monthNum);
        return monthObj ? monthObj.label : month;
      });

      // Info section with modern styling
      doc.setFontSize(10);
      const currentYearAmount = monthlyAmounts[selectedYear] || MONTHLY_AMOUNT;
      doc.text(`Months: ${monthLabels.join(', ')}`, 14, 42);
      doc.text(`Monthly Amount: ₹${currentYearAmount}`, 14, 48);

      const selectedBrotherIds = filterBrother.map(b => b.value);
      const displayBrothers = selectedBrotherIds.includes('all') ? BROTHERS_ORIGINAL : BROTHERS_ORIGINAL.filter(b => selectedBrotherIds.includes(b.id.toString()));
      
      const tableData = displayBrothers.map(brother => {
        const row = [brother.name];
        months.forEach(month => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          row.push(contribution?.amount || '-');
        });
        const brotherTotal = months.reduce((sum, month) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        const hasPaid = brotherTotal > 0;
        // Use badge-style text instead of background colors
        row.push(hasPaid ? '✓ Paid' : '○ Pending');
        row.push(brotherTotal > 0 ? brotherTotal : '-');
        return row;
      });

      // Add total row
      const totalRow = ['TOTAL'];
      months.forEach(month => {
        const monthTotal = displayBrothers.reduce((sum, brother) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        totalRow.push(monthTotal > 0 ? monthTotal : '-');
      });
      const grandTotal = displayBrothers.reduce((sum, brother) => {
        return sum + months.reduce((mSum, month) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return mSum + (contribution?.amount || 0);
        }, 0);
      }, 0);
      totalRow.push('-');
      totalRow.push(grandTotal > 0 ? grandTotal : '-');
      tableData.push(totalRow);

      // Add grand total summary row
      const summaryRow = ['GRAND TOTAL'];
      months.forEach(() => summaryRow.push(''));
      summaryRow.push('');
      summaryRow.push(grandTotal > 0 ? grandTotal : '-');
      tableData.push(summaryRow);

      const headers = ['Brother Name', ...monthLabels, 'Status', 'Total'];

      autoTable(doc, {
        startY: 55,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [16, 185, 129], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 25 },
        },
        didDrawCell: function(data) {
          // Draw badge-style status with rounded background
          const statusColIndex = headers.length - 2;
          const totalRowIndex = tableData.length - 2;
          const grandTotalRowIndex = tableData.length - 1;
          
          if (data.section === 'body' && data.column.index === statusColIndex && data.row.index < totalRowIndex) {
            const cell = data.cell;
            const text = cell.raw;
            const x = cell.x;
            const y = cell.y;
            const w = cell.width;
            const h = cell.height;
            
            if (text === '✓ Paid') {
              // Green background
              doc.setFillColor(16, 185, 129);
              doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(7);
              doc.setFont(undefined, 'bold');
              doc.text('Paid', x + w / 2, y + h / 2 + 1.5, { align: 'center' });
            } else if (text === '○ Pending') {
              // Orange background
              doc.setFillColor(245, 158, 11);
              doc.rect(x + 1, y + 1, w - 2, h - 2, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(7);
              doc.setFont(undefined, 'bold');
              doc.text('Pending', x + w / 2, y + h / 2 + 1.5, { align: 'center' });
            }
          }
        },
        didParseCell: function(data) {
          // Clear the default text for status column since we're drawing it manually
          const statusColIndex = headers.length - 2;
          const totalRowIndex = tableData.length - 2;
          const grandTotalRowIndex = tableData.length - 1;
          
          if (data.section === 'body' && data.column.index === statusColIndex && data.row.index < totalRowIndex) {
            data.cell.text = '';
          }
          // Style total row
          if (data.section === 'body' && data.row.index === totalRowIndex) {
            data.cell.styles.fillColor = [229, 231, 235];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [0, 0, 0];
          }
          // Style grand total row
          if (data.section === 'body' && data.row.index === grandTotalRowIndex) {
            data.cell.styles.fillColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`contributions-report-${selectedYear}.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    }
  }

  async function exportToExcel() {
    try {
      const XLSX = await import('xlsx');

      const months = getSelectedMonths();
      const monthLabels = months.map(month => {
        const [year, monthNum] = month.split('-').map(Number);
        const monthObj = MONTHS.find(m => m.value === monthNum);
        return monthObj ? monthObj.label : month;
      });

      const selectedBrotherIds = filterBrother.map(b => b.value);
      const displayBrothers = selectedBrotherIds.includes('all') ? BROTHERS_ORIGINAL : BROTHERS_ORIGINAL.filter(b => selectedBrotherIds.includes(b.id.toString()));
      
      const tableData = displayBrothers.map(brother => {
        const row = { 'Brother Name': brother.name };
        months.forEach((month, index) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          row[monthLabels[index]] = contribution?.amount_paid || '-';
        });
        const brotherTotal = months.reduce((sum, month) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        const hasPaid = brotherTotal > 0;
        row['Status'] = hasPaid ? 'Paid' : 'Pending';
        row['Total'] = brotherTotal > 0 ? brotherTotal : '-';
        return row;
      });

      // Add total row
      const totalRow = { 'Brother Name': 'TOTAL' };
      months.forEach((month, index) => {
        const monthTotal = displayBrothers.reduce((sum, brother) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        totalRow[monthLabels[index]] = monthTotal > 0 ? monthTotal : '-';
      });
      const grandTotal = displayBrothers.reduce((sum, brother) => {
        return sum + months.reduce((mSum, month) => {
          const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
          return mSum + (contribution?.amount || 0);
        }, 0);
      }, 0);
      totalRow['Status'] = '-';
      totalRow['Total'] = grandTotal > 0 ? grandTotal : '-';
      tableData.push(totalRow);

      // Add grand total summary
      const summaryRow = { 'Brother Name': 'GRAND TOTAL', 'Status': '', 'Total': grandTotal > 0 ? grandTotal : '-' };
      months.forEach((month, index) => {
        summaryRow[monthLabels[index]] = '';
      });
      tableData.push(summaryRow);

      const ws = XLSX.utils.json_to_sheet(tableData);
      
      // Apply cell coloring
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          
          if (cell && cell.v !== undefined) {
            // Color status column (second to last column)
            const statusColIndex = range.e.c - 1;
            if (R > 0 && C === statusColIndex) {
              if (cell.v === 'Paid') {
                cell.s = { fill: { patternType: 'solid', fgColor: { rgb: 'C6F135' } }, font: { color: { rgb: '000000' } } };
              } else if (cell.v === 'Pending') {
                cell.s = { fill: { patternType: 'solid', fgColor: { rgb: 'FF4D4D' } }, font: { color: { rgb: 'FFFFFF' } } };
              }
            }
            // Color total row (second to last row)
            if (R === range.e.r - 1) {
              const existingStyle = cell.s || {};
              cell.s = { 
                ...existingStyle,
                fill: { patternType: 'solid', fgColor: { rgb: 'E0E0E0' } },
                font: { bold: true, ...existingStyle?.font }
              };
            }
            // Style grand total row (last row)
            if (R === range.e.r) {
              const existingStyle = cell.s || {};
              cell.s = { 
                ...existingStyle,
                fill: { patternType: 'solid', fgColor: { rgb: 'C6F135' } },
                font: { bold: true, color: { rgb: '000000' }, ...existingStyle?.font }
              };
            }
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contributions');
      XLSX.writeFile(wb, `contributions-report-${selectedYear}.xlsx`);
      toast.success('Excel downloaded!');
    } catch (error) {
      console.error('Excel Error:', error);
      toast.error('Failed to export Excel: ' + error.message);
    }
  }

  async function exportAllMonthsToExcel() {
    try {
      const XLSX = await import('xlsx');

      let allContributions = [];
      // Fetch all contributions from database
      const { data } = await supabase.from('contributions').select('*');
      allContributions = (data || []).map(c => ({
        ...BROTHERS.find(b => b.id === c.brother_id),
        amount_paid: c.amount,
        month: c.month
      }));

      // Get all unique months
      const allMonths = [...new Set(allContributions.map(c => c.month))].sort();
      const monthLabels = allMonths.map(month => {
        const [year, monthNum] = month.split('-').map(Number);
        const monthObj = MONTHS.find(m => m.value === monthNum);
        return monthObj ? monthObj.label : month;
      });

      // Create pivot table data
      const tableData = BROTHERS.map(brother => {
        const row = { 'Brother Name': brother.name };
        allMonths.forEach((month, index) => {
          const contribution = allContributions.find(c => c.brother_id === brother.id && c.month === month);
          row[monthLabels[index]] = contribution?.amount || '-';
        });
        const brotherTotal = allMonths.reduce((sum, month) => {
          const contribution = allContributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        row['Total'] = brotherTotal;
        row['Status'] = brotherTotal > 0 ? 'Paid' : 'Pending';
        return row;
      });

      // Add total row
      const totalRow = { 'Brother Name': 'TOTAL' };
      allMonths.forEach((month, index) => {
        const monthTotal = BROTHERS.reduce((sum, brother) => {
          const contribution = allContributions.find(c => c.brother_id === brother.id && c.month === month);
          return sum + (contribution?.amount || 0);
        }, 0);
        totalRow[monthLabels[index]] = monthTotal > 0 ? monthTotal : '-';
      });
      const grandTotal = BROTHERS.reduce((sum, brother) => {
        return sum + allMonths.reduce((mSum, month) => {
          const contribution = allContributions.find(c => c.brother_id === brother.id && c.month === month);
          return mSum + (contribution?.amount || 0);
        }, 0);
      }, 0);
      totalRow['Status'] = '-';
      totalRow['Total'] = grandTotal > 0 ? grandTotal : '-';
      tableData.push(totalRow);

      // Add grand total summary row
      const summaryRow = { 'Brother Name': 'GRAND TOTAL', 'Status': '', 'Total': grandTotal > 0 ? grandTotal : '-' };
      allMonths.forEach((month, index) => {
        summaryRow[monthLabels[index]] = '';
      });
      tableData.push(summaryRow);

      const ws = XLSX.utils.json_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'All Contributions');
      XLSX.writeFile(wb, `contributions-all-months.xlsx`);
      toast.success('All months Excel downloaded!');
    } catch (error) {
      console.error('Excel Error:', error);
      toast.error('Failed to export all months: ' + error.message);
    }
  }

  useEffect(() => {
    fetchContributions();
  }, [selectedMonthDropdown, selectedYear]);

  const handleBrotherChange = (selectedOptions) => {
    // Handle "All Brothers" selection logic
    if (selectedOptions.some(option => option.value === 'all')) {
      // If "All Brothers" is selected, only keep that option
      setFilterBrother([{ value: 'all', label: 'All Brothers' }]);
    } else {
      // Otherwise, allow multiple selections or single selection
      setFilterBrother(selectedOptions);
    }
  };

  const handleYearChange = (selectedOptions) => {
    // Handle "All Years" selection logic
    if (selectedOptions.some(option => option.value === 'all')) {
      // If "All Years" is selected, only keep that option
      setSelectedYear([{ value: 'all', label: 'All Years' }]);
    } else {
      // Otherwise, allow multiple selections
      setSelectedYear(selectedOptions);
    }
  };

  const handleMonthChange = (selectedOptions) => {
    // Handle "All Months" selection logic
    if (selectedOptions.some(option => option.value === 'all')) {
      // If "All Months" is selected, only keep that option
      setSelectedMonthDropdown([{ value: 'all', label: 'All Months' }]);
    } else {
      // Otherwise, allow multiple selections
      setSelectedMonthDropdown(selectedOptions);
    }
  };

  // Prepare data for DataTable
  const getTableData = () => {
    const months = getSelectedMonths();
    const selectedBrotherIds = filterBrother.map(b => b.value);
    const displayBrothers = selectedBrotherIds.includes('all') ? BROTHERS_ORIGINAL : BROTHERS_ORIGINAL.filter(b => selectedBrotherIds.includes(b.id.toString()));
    
    return displayBrothers.map(brother => {
      const brotherTotal = months.reduce((sum, month) => {
        const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
        return sum + (contribution?.amount || 0);
      }, 0);
      const hasPaid = brotherTotal > 0;

      const rowData = {
        id: brother.id,
        brotherName: brother.name,
        total: brotherTotal,
        status: hasPaid ? 'Paid' : 'Pending',
        hasPaid
      };

      // Add dynamic month columns
      months.forEach(month => {
        const contribution = contributions.find(c => c.brother_id === brother.id && c.month === month);
        const [year, monthNum] = month.split('-').map(Number);
        const monthObj = MONTHS.find(m => m.value === monthNum);
        const monthLabel = monthObj ? monthObj.label : month;
        
        rowData[month] = contribution?.amount || 0;
        rowData[`${month}_label`] = monthLabel;
      });

      return rowData;
    });
  };

  // Dynamic columns for ModernTable
  const getTableColumns = () => {
    const months = getSelectedMonths();
    
    const baseColumns = [
      {
        key: 'brotherName',
        title: 'Brother Name',
        sortable: true,
      }
    ];

    // Add dynamic month columns
    const monthColumns = months.map(month => {
      const [year, monthNum] = month.split('-').map(Number);
      const monthObj = MONTHS.find(m => m.value === monthNum);
      const monthLabel = monthObj ? monthObj.label : month;
      
      return {
        key: month,
        title: monthLabel,
        sortable: true,
        render: (value) => {
          if (value > 0) {
            return (
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'rgba(198, 241, 53, 0.2)',
                color: '#C6F135',
                display: 'inline-block'
              }}>
                ₹{value}
              </span>
            );
          } else {
            return (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}>
                -
              </span>
            );
          }
        }
      };
    });

    const actionColumns = [
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        render: (value, row) => (
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: row.hasPaid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 193, 7, 0.2)',
            color: row.hasPaid ? '#22C55E' : '#FFC107',
            display: 'inline-block'
          }}>
            {value}
          </span>
        )
      },
      {
        key: 'action',
        title: 'Action',
        sortable: false,
        render: (value, row) => (
          row.hasPaid ? (
            <span style={{ 
              color: 'var(--accent-lime)', 
              fontSize: '0.75rem', 
              fontWeight: 600 
            }}>
              ✓ Paid
            </span>
          ) : (
            <button
              className="btn-primary-custom"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={() => handleAddContribution(row.id)}
            >
              Mark Paid
            </button>
          )
        )
      },
      {
        key: 'total',
        title: 'Total',
        sortable: true,
        render: (value) => (
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            ₹{value.toLocaleString('en-IN')}
          </span>
        )
      }
    ];

    return [...baseColumns, ...monthColumns, ...actionColumns];
  };

  const getFilteredContributions = () => {
    let filtered = contributions;
    // Note: year/month filtering already done in fetchContributions database query

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'paid') {
        filtered = filtered.filter(c => c.amount_paid > 0);
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(c => !c.amount_paid || c.amount_paid === 0);
      }
    }

    // Filter by brother
    const selectedBrotherIds = filterBrother.map(b => b.value);
    if (!selectedBrotherIds.includes('all')) {
      filtered = filtered.filter(c => selectedBrotherIds.includes(c.brother_id));
    }

    return filtered;
  };

  const getSelectedMonths = () => {
    const selectedMonthValues = selectedMonthDropdown.map(m => m.value);
    
    if (selectedYear !== 'all' && !selectedMonthValues.includes('all')) {
      // Get selected months in the specific year
      const months = [];
      selectedMonthValues.forEach(month => {
        months.push(`${selectedYear}-${String(month).padStart(2, '0')}`);
      });
      return months;
    } else if (selectedYear !== 'all' && selectedMonthValues.includes('all')) {
      // Get all months in the selected year
      const months = [];
      MONTHS.forEach(m => {
        months.push(`${selectedYear}-${String(m.value).padStart(2, '0')}`);
      });
      return months;
    } else if (selectedYear === 'all' && !selectedMonthValues.includes('all')) {
      // Get selected months across all years
      const months = [];
      const allYears = [...new Set(contributions.map(c => c.month.split('-')[0]))];
      allYears.forEach(year => {
        selectedMonthValues.forEach(month => {
          months.push(`${year}-${String(month).padStart(2, '0')}`);
        });
      });
      return months;
    } else {
      // Get all unique months from contributions
      const allMonths = [...new Set(contributions.map(c => c.month))].sort();
      return allMonths;
    }
  };

  const getGroupedData = () => {
    const filtered = getFilteredContributions();
    const grouped = {};

    if (groupBy === 'month') {
      filtered.forEach(c => {
        if (!grouped[c.month]) grouped[c.month] = [];
        grouped[c.month].push(c);
      });
    } else if (groupBy === 'brother') {
      filtered.forEach(c => {
        if (!grouped[c.name]) grouped[c.name] = [];
        grouped[c.name].push(c);
      });
    }

    return grouped;
  };

  const getMetrics = () => {
    const filtered = getFilteredContributions();
    const selectedMonthValues = selectedMonthDropdown.map(m => m.value);
    const monthsCount = selectedMonthValues.includes('all') ? 12 : selectedMonthValues.length;
    
    // Check if brother filter is applied
    const selectedBrotherIds = filterBrother.map(b => b.value);
    const brotherCount = selectedBrotherIds.includes('all') ? BROTHERS_ORIGINAL.length : selectedBrotherIds.length;

    let totalExpected = 0;
    let expectedSlots = 0;
    
    if (selectedYear === 'all') {
      // When all years selected, calculate based on all years in the database
      const allYears = [...new Set(contributions.map(c => c.month.split('-')[0]))];
      allYears.forEach(year => {
        const yearAmount = monthlyAmounts[year] || MONTHLY_AMOUNT;
        // For all years, assume 12 months
        totalExpected += brotherCount * 12 * yearAmount;
        expectedSlots += brotherCount * 12;
      });
    } else {
      // When specific year selected, use that year's amount
      const currentYearAmount = monthlyAmounts[selectedYear] || MONTHLY_AMOUNT;
      totalExpected = brotherCount * monthsCount * currentYearAmount;
      expectedSlots = brotherCount * monthsCount;
    }

    const totalCollected = filtered.reduce((s, c) => s + (c.amount || 0), 0);
    const paidCount = filtered.filter(c => c.amount > 0).length;
    const pendingCount = expectedSlots - paidCount;

    return {
      totalExpected,
      totalCollected,
      paidCount,
      pendingCount,
      completionRate: expectedSlots > 0 ? (paidCount / expectedSlots * 100).toFixed(1) : 0
    };
  };

  const filtered = filterCat === 'all' ? expenses : expenses.filter((e) => e.category === filterCat);
  const totalAmount = filtered.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const thisMonth = expenses.filter((e) => {
    const d = parseISO(e.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const categoryTotals = CATEGORIES.map((c) => ({
    name: c.label.split(' ')[1],
    total: expenses.filter((e) => e.category === c.value).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
  })).filter((c) => c.total > 0);

  return (
    <div className="container section">
      <PageHeader
        icon={<BsCurrencyRupee />}
        title="Payment Tracker"
        subtitle="Track and manage monthly family contributions"
        badge="Finance"
      />

      {/* Payment Tracking Stats */}
      <div className="expenses-summary">
        {(() => {
          const metrics = getMetrics();
          return [
            { label: 'Total Expected', value: `₹${metrics.totalExpected.toLocaleString('en-IN')}`, color: '#10B981' },
            { label: 'Total Collected', value: `₹${metrics.totalCollected.toLocaleString('en-IN')}`, color: '#10B981' },
            { label: 'Paid Count', value: metrics.paidCount, color: '#10B981' },
            { label: 'Pending Count', value: metrics.pendingCount, color: '#F59E0B' },
          ].map((s) => (
            <div key={s.label} className="payment-stat-card">
              <div className="payment-stat-label">{s.label}</div>
              <div className="payment-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ));
        })()}
      </div>


      {/* Monthly Contributions Section */}
      <div className="contributions-section mb-5">
        <div className="contributions-header">
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>Monthly Contributions Report</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              ₹{monthlyAmounts[selectedYear] || MONTHLY_AMOUNT} per brother per month ({selectedYear})
            </p>
          </div>
          <button
            onClick={() => fetchMembers()}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            title="Refresh assigned members list"
          >
            🔄 Refresh Members
          </button>
        </div>

        {/* Report Controls */}
        <div className="report-controls" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, padding: 16, background: 'var(--bg-input)', borderRadius: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Year</label>
            <LazySelect
              options={YEAR_OPTIONS}
              value={YEAR_OPTIONS.find(option => option.value === selectedYear.toString())}
              onChange={(selectedOption) => setSelectedYear(selectedOption.value === 'all' ? 'all' : parseInt(selectedOption.value))}
              isMulti={false}
              isClearable={false}
              placeholder="Select year..."
              styles={singleSelectStyles}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Month</label>
            <LazySelect
              options={MONTH_OPTIONS}
              value={selectedMonthDropdown}
              onChange={handleMonthChange}
              isMulti
              isClearable={false}
              placeholder="Select months..."
              styles={{
                ...singleSelectStyles,
                multiValue: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: 'var(--accent-purple)',
                  borderRadius: '4px',
                }),
                multiValueLabel: (baseStyles) => ({
                  ...baseStyles,
                  color: 'white',
                  fontSize: '0.8rem',
                }),
                multiValueRemove: (baseStyles) => ({
                  ...baseStyles,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'var(--accent-red)',
                    color: 'white',
                  },
                }),
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Group By</label>
            <LazySelect
              options={GROUP_BY_OPTIONS}
              value={GROUP_BY_OPTIONS.find(option => option.value === groupBy)}
              onChange={(selectedOption) => setGroupBy(selectedOption.value)}
              isMulti={false}
              isClearable={false}
              placeholder="Select grouping..."
              styles={singleSelectStyles}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</label>
            <LazySelect
              options={STATUS_OPTIONS}
              value={STATUS_OPTIONS.find(option => option.value === filterStatus)}
              onChange={(selectedOption) => setFilterStatus(selectedOption.value)}
              isMulti={false}
              isClearable={false}
              placeholder="Select status..."
              styles={singleSelectStyles}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Brother</label>
            <LazySelect
              options={BROTHERS}
              value={filterBrother}
              onChange={handleBrotherChange}
              isMulti
              isClearable={false}
              placeholder="Select brothers..."
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  minHeight: '36px',
                  '&:hover': {
                    borderColor: 'var(--border)',
                  },
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  zIndex: 9999,
                }),
                option: (baseStyles, state) => ({
                  ...baseStyles,
                  backgroundColor: state.isFocused ? 'var(--bg-hover)' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--bg-hover)',
                  },
                }),
                multiValue: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: 'var(--accent-purple)',
                  borderRadius: '4px',
                }),
                multiValueLabel: (baseStyles) => ({
                  ...baseStyles,
                  color: 'white',
                  fontSize: '0.8rem',
                }),
                multiValueRemove: (baseStyles) => ({
                  ...baseStyles,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'var(--accent-red)',
                    color: 'white',
                  },
                }),
                placeholder: (baseStyles) => ({
                  ...baseStyles,
                  color: 'var(--text-secondary)',
                }),
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginLeft: 'auto' }}>
            <button
              className="btn-secondary-custom"
              onClick={exportToPDF}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Export PDF
            </button>
            <button
              className="btn-secondary-custom"
              onClick={exportToExcel}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Export Excel
            </button>
                      </div>
        </div>

        {/* Monthly Amount Settings */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ 
            padding: 16, 
            background: 'var(--bg-input)', 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Monthly Amount Settings
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Set custom amounts for different months
              </p>
            </div>
            <button
              className="btn-secondary-custom"
              onClick={() => setShowAmountSettings(!showAmountSettings)}
              style={{ fontSize: '0.85rem' }}
            >
              {showAmountSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          </div>
          
          {showAmountSettings && (
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: 'var(--bg-card)', 
              borderRadius: 8, 
              border: '1px solid var(--border)' 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Year
                  </label>
                  <LazySelect
                    options={YEAR_OPTIONS}
                    value={YEAR_OPTIONS.find(option => option.value === settingsYear.toString())}
                    onChange={(selectedOption) => setSettingsYear(selectedOption.value === 'all' ? new Date().getFullYear() : parseInt(selectedOption.value))}
                    isMulti={false}
                    isClearable={false}
                    placeholder="Select year..."
                    styles={singleSelectStyles}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Monthly Amount for {settingsYear}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>₹</span>
                    <input
                      type="number"
                      value={tempAmount}
                      onChange={(e) => setTempAmount(parseFloat(e.target.value) || 0)}
                      style={{
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        width: '100%'
                      }}
                      min="0"
                      step="50"
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>per month</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  This amount will be used for all months in {settingsYear}
                </p>
                <button
                  className="btn-primary-custom"
                  onClick={() => updateYearlyAmount(settingsYear, tempAmount)}
                  style={{ marginTop: 8 }}
                >
                  Save Amount
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="contributions-table" style={{ overflowX: 'auto' }}>
          {selectedYear !== 'all' && (
            <div style={{ 
              marginBottom: 16, 
              padding: 12, 
              backgroundColor: 'var(--bg-input)', 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              Year: {selectedYear}
            </div>
          )}
          {BROTHERS_ORIGINAL.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 2rem',
              textAlign: 'center',
              minHeight: '300px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.5
              }}>
                <BsPeopleFill />
              </div>
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                fontWeight: 600 
              }}>
                No Members Assigned
              </h3>
              <p style={{ 
                color: 'var(--text-muted)', 
                marginBottom: '1.5rem',
                maxWidth: '400px'
              }}>
                No members have been assigned to expense tracking yet. Please contact an admin to assign members to the expense tracker.
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)'
                }}>
                  <strong>0</strong> Paid Members
                </div>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)'
                }}>
                  <strong>0</strong> Pending Members
                </div>
              </div>
            </div>
          ) : (
            <div style={{ minWidth: '800px' }}>
              <ModernTable
                columns={getTableColumns()}
                data={getTableData()}
                pagination={false}
                emptyMessage="No contribution data available. Try adjusting your filters or check back later."
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {(() => {
              const months = getSelectedMonths();
              return `Showing ${months.length} month(s)`;
            })()}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            {(() => {
              const filtered = getFilteredContributions();
              const total = filtered.reduce((s, c) => s + (c.amount_paid || 0), 0);
              return `Total: ₹${total.toLocaleString('en-IN')}`;
            })()}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Expense</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><BsXLg /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="expense-form-grid">
                <div>
                  <label className="label-custom">Title</label>
                  <input className="input-custom" required placeholder="e.g. Diwali shopping" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Amount (₹)</label>
                  <input className="input-custom" type="number" required min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Category</label>
                  <LazySelect
                    options={CATEGORY_OPTIONS}
                    value={CATEGORY_OPTIONS.find(option => option.value === form.category)}
                    onChange={(selectedOption) => setForm({ ...form, category: selectedOption.value })}
                    isMulti={false}
                    isClearable={false}
                    placeholder="Select category..."
                    styles={singleSelectStyles}
                  />
                </div>
                <div>
                  <label className="label-custom">Description (optional)</label>
                  <input className="input-custom" placeholder="Add a note..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="split" checked={form.is_split} onChange={(e) => setForm({ ...form, is_split: e.target.checked })} style={{ accentColor: 'var(--accent-purple)' }} />
                <label htmlFor="split" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Split with family
                </label>
              </div>
              <button className="btn-primary-custom" style={{ justifyContent: 'center', width: '100%', marginTop: 20 }} disabled={saving}>
                {saving ? 'Saving…' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
