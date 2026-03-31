'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList, CheckCircle2, XCircle, Eye, Trash2 } from 'lucide-react';
import { adminBookingsAPI } from '@/lib/api';
import { BookingDetailModal, ConfirmModal } from '../components';
import styles from '../admin.module.css';

const STATUS_TABS = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'processed', label: 'Обработанные' },
  { value: 'cancelled', label: 'Отменённые' },
];

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getStatusBadge(status) {
  switch (status) {
    case 'processed':
      return <span className={`${styles.badge} ${styles.active}`}>Обработано</span>;
    case 'cancelled':
      return <span className={`${styles.badge} ${styles.inactive}`}>Отменено</span>;
    default:
      return <span className={`${styles.badge} ${styles.pending}`}>Новое</span>;
  }
}

function formatSurnameInitials(fullName) {
  const raw = (fullName || '').trim();
  if (!raw) return '—';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const looksLikeSurname = (s) => /(?:ов|ев|ёв|ин|ына|ина|ский|цкий|ская|цкая|ова|ева|ёва|ая|яя)$/i.test(String(s || '').trim());

  let surname = '';
  let name = '';
  let patronymic = '';

  if (parts.length >= 3) {
    // Эвристика: если первое слово похоже на фамилию — используем "Фамилия Имя Отчество", иначе "Имя Отчество Фамилия"
    if (looksLikeSurname(parts[0]) && !looksLikeSurname(parts[parts.length - 1])) {
      surname = parts[0];
      name = parts[1] || '';
      patronymic = parts[2] || '';
    } else {
      surname = parts[parts.length - 1];
      name = parts[0] || '';
      patronymic = parts[1] || '';
    }
  } else {
    // 2 слова: "Имя Фамилия" (по умолчанию)
    surname = parts[1];
    name = parts[0];
  }

  const n = name ? `${name[0].toUpperCase()}.` : '';
  const p = patronymic ? `${patronymic[0].toUpperCase()}.` : '';
  return `${surname} ${n}${p}`.trim();
}

export default function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statusTab, setStatusTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem('admin_bookings_limit');
    return saved ? parseInt(saved, 10) : 10;
  });

  const MIN_LOADING_MS = 500;
  const searchDebounceRef = useRef(null);
  const lastFetchedPageRef = useRef(null);
  const lastFetchedSortRef = useRef({ sortBy: null, sortOrder: 'asc' });

  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || null);
  const [sortOrder, setSortOrder] = useState(() => {
    const url = searchParams.get('sortOrder');
    return url === 'asc' || url === 'desc' ? url : 'asc';
  });

  const handleSort = (field) => {
    const newParams = new URLSearchParams(searchParams);
    let newSortBy = field;
    let newSortOrder = 'asc';

    if (sortBy === field) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      newSortBy = field;
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    newParams.set('sortBy', newSortBy);
    newParams.set('sortOrder', newSortOrder);
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const handleResetSort = () => {
    setSortBy(null);
    setSortOrder('asc');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('sortBy');
    newParams.delete('sortOrder');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const fetchBookings = async (page, updateUrl = true) => {
    const start = Date.now();
    setIsLoading(true);
    try {
      const params = { page, limit };
      if (statusTab !== 'all') params.status = statusTab;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }

      const res = await adminBookingsAPI.getAll(params);
      setItems(res.data?.items ?? []);
      setPagination(res.data?.pagination ?? { page: 1, pages: 1, total: 0 });
      lastFetchedPageRef.current = page;

      if (updateUrl) {
        const newParams = new URLSearchParams(searchParams);
        const urlPage = parseInt(newParams.get('page') || '1', 10);
        if (page !== urlPage) {
          if (page === 1) newParams.delete('page');
          else newParams.set('page', String(page));
          setSearchParams(newParams, { replace: true });
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки бронирований:', e);
      setItems([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    localStorage.setItem('admin_bookings_limit', newLimit.toString());
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
    fetchBookings(1, true);
  };

  const handlePageChange = (newPage) => {
    fetchBookings(newPage, true);
  };

  useEffect(() => {
    const urlSortBy = searchParams.get('sortBy');
    const urlSortOrder = searchParams.get('sortOrder');

    if (urlSortBy !== sortBy) setSortBy(urlSortBy || null);
    if (urlSortOrder && urlSortOrder !== sortOrder && (urlSortOrder === 'asc' || urlSortOrder === 'desc')) {
      setSortOrder(urlSortOrder);
    }
    if (!urlSortBy && sortBy !== null) {
      setSortBy(null);
      setSortOrder('asc');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let urlPage = parseInt(searchParams.get('page') || '1', 10);
    const lastFetchedPage = lastFetchedPageRef.current;
    const sortChanged =
      sortBy !== lastFetchedSortRef.current.sortBy || sortOrder !== lastFetchedSortRef.current.sortOrder;
    const shouldFetch = lastFetchedPage === null || urlPage !== lastFetchedPage || sortChanged;
    if (shouldFetch) {
      lastFetchedSortRef.current = { sortBy, sortOrder };
      fetchBookings(urlPage, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sortBy, sortOrder]);

  useEffect(() => {
    if (lastFetchedPageRef.current === null) return;
    // при смене фильтров — первая страница
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
    fetchBookings(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, limit]);

  useEffect(() => {
    if (lastFetchedPageRef.current === null) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('page');
      setSearchParams(newParams, { replace: true });
      fetchBookings(1, true);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const statusCounts = useMemo(() => {
    const acc = { all: 0, new: 0, processed: 0, cancelled: 0 };
    items.forEach((i) => {
      acc.all += 1;
      if (i.status === 'processed') acc.processed += 1;
      else if (i.status === 'cancelled') acc.cancelled += 1;
      else acc.new += 1;
    });
    return acc;
  }, [items]);

  const handleUpdateStatus = (id, nextStatus) => {
    adminBookingsAPI
      .updateStatus(id, nextStatus)
      .then((res) => {
        const updated = res.data;
        setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
      })
      .catch((e) => {
        console.error('Ошибка обновления статуса:', e);
      });
  };

  const requestStatusChange = ({ booking, nextStatus, closeDetailAfter = false }) => {
    if (!booking?.id) return;
    const isCancel = nextStatus === 'cancelled';
    setConfirmModal({
      title: isCancel ? 'Отменить бронирование?' : 'Подтвердить бронирование?',
      message: isCancel
        ? `Отменить бронирование для "${booking.contactName || '—'}" (${booking.direction || '—'})?`
        : `Отметить бронирование как обработанное для "${booking.contactName || '—'}" (${booking.direction || '—'})?`,
      confirmLabel: isCancel ? 'Отменить' : 'Подтвердить',
      cancelLabel: 'Назад',
      variant: isCancel ? 'danger' : 'default',
      onConfirm: async () => {
        handleUpdateStatus(booking.id, nextStatus);
        setConfirmModal(null);
        if (closeDetailAfter) setSelectedBooking(null);
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const requestSoftDelete = ({ booking, closeDetailAfter = false }) => {
    if (!booking?.id) return;
    setConfirmModal({
      title: 'Удалить бронирование?',
      message: `Скрыть бронирование для "${booking.contactName || '—'}" (${booking.direction || '—'})?`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Назад',
      variant: 'danger',
      onConfirm: async () => {
        adminBookingsAPI
          .setVisibility(booking.id, false)
          .then(() => {
            setItems((prev) => prev.filter((it) => it.id !== booking.id));
          })
          .catch((e) => {
            console.error('Ошибка удаления (скрытия):', e);
          })
          .finally(() => {
            setConfirmModal(null);
            if (closeDetailAfter) setSelectedBooking(null);
          });
      },
      onCancel: () => setConfirmModal(null),
    });
  };

  const renderPagination = () => (
    <>
      <div className={styles.paginationLimit}>
        <label htmlFor="limit-select">Показывать:</label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
          className={styles.limitSelect}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className={styles.pageBtn}
            aria-label="Предыдущая страница"
          >
            <ChevronLeft size={18} />
          </button>
          {(() => {
            const pages = [];
            const totalPages = pagination.pages;
            const current = pagination.page;
            if (current > 3) {
              pages.push(
                <button key={1} onClick={() => handlePageChange(1)} className={styles.pageBtn}>
                  1
                </button>
              );
              if (current > 4) pages.push(<span key="ellipsis1" className={styles.ellipsis}>...</span>);
            }
            const start = Math.max(1, current - 2),
              end = Math.min(totalPages, current + 2);
            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`${styles.pageBtn} ${current === i ? styles.active : ''}`}
                >
                  {i}
                </button>
              );
            }
            if (current < totalPages - 2) {
              if (current < totalPages - 3) pages.push(<span key="ellipsis2" className={styles.ellipsis}>...</span>);
              pages.push(
                <button key={totalPages} onClick={() => handlePageChange(totalPages)} className={styles.pageBtn}>
                  {totalPages}
                </button>
              );
            }
            return pages;
          })()}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className={styles.pageBtn}
            aria-label="Следующая страница"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Бронирования</h1>
        <div className={styles.pageHeaderActions}>
          <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder="Поиск (имя, телефон, email, направление...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Поиск бронирований"
            />
            <Search size={18} className={styles.searchIcon} aria-hidden />
          </div>
        </div>
      </div>

      <div className={styles.reviewTabs}>
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`${styles.reviewTab} ${statusTab === value ? styles.reviewTabActive : ''}`}
            onClick={() => setStatusTab(value)}
            title={label}
          >
            {label}
            {statusCounts[value] ? <span style={{ marginLeft: 8, opacity: 0.7 }}>({statusCounts[value]})</span> : null}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.spinner}></div>
              <p>Загрузка...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.icon}><ClipboardList size={48} /></div>
              <h3>Бронирования не найдены</h3>
              <p>{searchQuery ? 'Попробуйте изменить параметры поиска' : 'Пока нет заявок на бронирование'}</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortableHeader} style={{ width: '15%', minWidth: 160 }} onClick={() => handleSort('bookingDate')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Дата бронирования</span>
                      {sortBy === 'bookingDate' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('direction')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Направление</span>
                      {sortBy === 'direction' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('contactName')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Контакты</span>
                      {sortBy === 'contactName' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th className={styles.sortableHeader} style={{ width: '26%' }} onClick={() => handleSort('entityTitle')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Объект</span>
                      {sortBy === 'entityTitle' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('type')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Тип</span>
                      {sortBy === 'type' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th className={styles.sortableHeader} onClick={() => handleSort('status')}>
                    <span className={styles.sortHeaderInner}>
                      <span>Статус</span>
                      {sortBy === 'status' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className={styles.sortIconInactive} />}
                    </span>
                  </th>
                  <th>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Действия</span>
                      {sortBy && (
                        <button
                          onClick={handleResetSort}
                          className={styles.resetSortIconBtn}
                          title="Сбросить сортировку"
                          aria-label="Сбросить сортировку"
                        >
                          <RotateCcw size={14} className={styles.sortIconInactive} />
                        </button>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td style={{ width: '15%', minWidth: 160 }}>
                      <div className={styles.cellInner} style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(b.bookingDate)}
                      </div>
                    </td>
                    <td><div className={styles.cellInner}>{b.direction || '—'}</div></td>
                    <td>
                      <div className={styles.cellInner} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <div>{formatSurnameInitials(b.contactName)}</div>
                      </div>
                    </td>
                    <td style={{ width: '26%' }}>
                      <div className={styles.cellInner} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <div>{formatSurnameInitials(b.entityTitle)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellInner}>
                        {b.category || b.entityType || '—'}
                      </div>
                    </td>
                    <td><div className={styles.cellInner}>{getStatusBadge(b.status)}</div></td>
                    <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                      <div className={styles.cellInner}>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className={styles.viewBtn}
                            title="Подробно"
                          >
                            <Eye size={16} />
                          </button>
                          {b.status === 'new' ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusChange({ booking: b, nextStatus: 'processed', closeDetailAfter: false })
                                }
                                className={styles.viewBtn}
                                title="Отметить как обработано"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusChange({ booking: b, nextStatus: 'cancelled', closeDetailAfter: false })
                                }
                                className={styles.deleteBtn}
                                title="Отменить"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => requestSoftDelete({ booking: b, closeDetailAfter: false })}
                            className={styles.deleteBtn}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(pagination.pages > 1 || pagination.total > 0) && (
        <div className={styles.paginationFooter}>{renderPagination()}</div>
      )}

      <BookingDetailModal
        open={!!selectedBooking}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onConfirm={() => {
          requestStatusChange({ booking: selectedBooking, nextStatus: 'processed', closeDetailAfter: true });
        }}
        onCancel={() => {
          requestStatusChange({ booking: selectedBooking, nextStatus: 'cancelled', closeDetailAfter: true });
        }}
      />

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        confirmLabel={confirmModal?.confirmLabel}
        cancelLabel={confirmModal?.cancelLabel}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={confirmModal?.onCancel}
      />
    </div>
  );
}

