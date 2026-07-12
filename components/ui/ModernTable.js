'use client';

import { useState, useMemo } from 'react';

export default function ModernTable({ 
  data, 
  columns, 
  pagination = true, 
  itemsPerPage = 10,
  className = '',
  emptyMessage = 'No data available'
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const value = item[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, columns, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortConfig.direction === 'ascending') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.3 }}>
          <path d="M0 0l5 6 5-6z" fill="currentColor"/>
        </svg>
      );
    }
    
    if (sortConfig.direction === 'ascending') {
      return (
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M0 0l5 6 5-6z" fill="var(--accent-primary)"/>
        </svg>
      );
    }
    
    return (
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M0 6l5-6 5 6z" fill="var(--accent-primary)"/>
      </svg>
    );
  };

  const renderCell = (item, column) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    if (column.format) {
      return column.format(value);
    }
    
    if (value === null || value === undefined) {
      return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }
    
    return String(value);
  };

  return (
    <div className={`modern-table-container ${className}`}>
      {/* Search Bar */}
      {data.length > 0 && (
        <div className="table-search">
          <div className="search-input-wrapper">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 2.5V9.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2.5 6H9.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 9.5 C6 9.5 2 12 2 14 H10 C10 12 6 9.5 6 9.5Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        {paginatedData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>{emptyMessage}</h3>
            {searchTerm && (
              <p>No results found for "{searchTerm}"</p>
            )}
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                    className={column.sortable !== false ? 'sortable' : ''}
                  >
                    <div className="th-content">
                      <span>{column.title}</span>
                      {column.sortable !== false && (
                        <span className="sort-icon">{getSortIcon(column.key)}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <tr key={item.id || index} className="table-row">
                  {columns.map((column) => (
                    <td key={column.key} className="table-cell">
                      {renderCell(item, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-btn page-number ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
