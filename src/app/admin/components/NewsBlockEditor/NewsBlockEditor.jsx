'use client';

import { useState, useRef, useEffect } from 'react';
import { GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Type, Image, Images, Quote, Video, Heading, Plus } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import { getImageUrl } from '@/lib/api';
import styles from './NewsBlockEditor.module.css';

function PendingImage({ file, alt = '', className }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!file || !url) return null;
  return <img src={url} alt={alt} className={className} />;
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'Заголовок (якорь)', icon: Heading },
  { type: 'text', label: 'Текстовый блок', icon: Type },
  { type: 'image', label: 'Одна картинка', icon: Image },
  { type: 'gallery', label: 'Галерея картинок', icon: Images },
  { type: 'quote', label: 'Цитата', icon: Quote },
  { type: 'video', label: 'Видео VK', icon: Video },
];

function generateBlockId() {
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyBlock(type) {
  const id = generateBlockId();
  const base = { id, type, order: 0 };
  switch (type) {
    case 'heading':
      return { ...base, data: { text: '' } };
    case 'text':
      return { ...base, data: { content: '' } };
    case 'image':
      return { ...base, data: { url: '' } };
    case 'gallery':
      return { ...base, data: { images: [] } };
    case 'quote':
      return { ...base, data: { content: '' } };
    case 'video':
      return { ...base, data: { url: '' } };
    default:
      return { ...base, data: {} };
  }
}

function slugFromText(text) {
  if (!text || !text.trim()) return '';
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
      return map[c] || c;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function NewsBlockEditor({ blocks = [], onChange, pendingBlockFiles = {}, onPendingBlockFilesChange }) {
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [hoveredInsertIndex, setHoveredInsertIndex] = useState(null);
  const [openInsertIndex, setOpenInsertIndex] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({});
  const addBlockRef = useRef(null);
  const insertRefs = useRef({});

  const sortedBlocks = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const calculateDropdownPosition = (index) => {
    const insertArea = insertRefs.current[index];
    if (!insertArea) return 'bottom';

    const rect = insertArea.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 350; // Примерная высота выпадающего меню с учетом всех опций

    // Если места снизу недостаточно и сверху больше места - показываем сверху
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      return 'top';
    }
    // Если места сверху недостаточно и снизу больше места - показываем снизу
    if (spaceAbove < dropdownHeight && spaceBelow > spaceAbove) {
      return 'bottom';
    }
    // По умолчанию показываем снизу
    return 'bottom';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addBlockRef.current && !addBlockRef.current.contains(e.target)) {
        setAddBlockOpen(false);
      }
      if (openInsertIndex !== null && insertRefs.current[openInsertIndex] && !insertRefs.current[openInsertIndex].contains(e.target)) {
        setOpenInsertIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openInsertIndex]);

  useEffect(() => {
    if (openInsertIndex !== null) {
      const position = calculateDropdownPosition(openInsertIndex);
      setDropdownPosition(prev => ({ ...prev, [openInsertIndex]: position }));
    }
  }, [openInsertIndex]);

  useEffect(() => {
    if (openInsertIndex !== null) {
      const handleResize = () => {
        const position = calculateDropdownPosition(openInsertIndex);
        setDropdownPosition(prev => ({ ...prev, [openInsertIndex]: position }));
      };
      const handleScroll = () => {
        const position = calculateDropdownPosition(openInsertIndex);
        setDropdownPosition(prev => ({ ...prev, [openInsertIndex]: position }));
      };
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [openInsertIndex]);

  const updateBlock = (index, updates) => {
    const next = sortedBlocks.map((b, i) =>
      i === index ? { ...b, ...updates, data: { ...b.data, ...(updates.data || {}) } } : b
    );
    onChange(next.map((b, i) => ({ ...b, order: i })));
  };

  const addBlock = (type) => {
    const newBlock = createEmptyBlock(type);
    newBlock.order = sortedBlocks.length;
    onChange([...sortedBlocks, newBlock]);
    setAddBlockOpen(false);
  };

  const addBlockAfter = (afterIndex, type) => {
    const newBlock = createEmptyBlock(type);
    const insertIndex = afterIndex + 1;
    const next = [...sortedBlocks];
    next.splice(insertIndex, 0, newBlock);
    onChange(next.map((b, i) => ({ ...b, order: i })));
    setOpenInsertIndex(null);
    setHoveredInsertIndex(null);
  };

  const removeBlock = (index) => {
    const block = sortedBlocks[index];
    if (block) onPendingBlockFilesChange?.(block.id, null);
    const next = sortedBlocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i }));
    onChange(next);
  };

  const moveBlock = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sortedBlocks.length) return;
    const next = [...sortedBlocks];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next.map((b, i) => ({ ...b, order: i })));
  };

  const moveBlockByDrag = (draggedIndex, targetIndex) => {
    if (draggedIndex === targetIndex) return;
    const next = [...sortedBlocks];
    const [removed] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, removed);
    onChange(next.map((b, i) => ({ ...b, order: i })));
  };

  const handleVideoChange = (value, index) => {
    let url = value.trim();
    if (url.includes('<iframe') && url.includes('src=')) {
      const m = url.match(/src=["']([^"']+)["']/);
      if (m) url = m[1];
    }
    updateBlock(index, { data: { url } });
  };

  const handleImageFileSelect = (e, index) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const block = sortedBlocks[index];
    if (!block) return;
    onPendingBlockFilesChange?.(block.id, { url: file, images: undefined });
  };

  const handleGalleryFileSelect = (e, index) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const block = sortedBlocks[index];
    if (!block) return;
    const prev = pendingBlockFiles[block.id]?.images || [];
    onPendingBlockFilesChange?.(block.id, { url: undefined, images: [...prev, ...files] });
  };

  const removeGalleryImage = (blockIndex, imgIndex) => {
    const block = sortedBlocks[blockIndex];
    if (!block) return;
    const saved = block.data?.images || [];
    const pending = pendingBlockFiles[block.id]?.images || [];
    if (imgIndex < saved.length) {
      const images = saved.filter((_, i) => i !== imgIndex);
      updateBlock(blockIndex, { data: { images } });
    } else {
      const pendingIndex = imgIndex - saved.length;
      const next = pending.filter((_, i) => i !== pendingIndex);
      onPendingBlockFilesChange?.(block.id, next.length ? { images: next } : null);
    }
  };

  const [draggedGalleryImage, setDraggedGalleryImage] = useState(null);
  const [dragOverGalleryImage, setDragOverGalleryImage] = useState(null);

  const moveGalleryImageTo = (blockIndex, fromIndex, toIndex) => {
    const block = sortedBlocks[blockIndex];
    if (!block) return;
    const saved = block.data?.images || [];
    const pending = pendingBlockFiles[block.id]?.images || [];
    if (fromIndex < saved.length && toIndex < saved.length) {
      const arr = [...saved];
      const [item] = arr.splice(fromIndex, 1);
      const dropIdx = fromIndex < toIndex ? toIndex - 1 : toIndex;
      arr.splice(dropIdx, 0, item);
      updateBlock(blockIndex, { data: { images: arr } });
    } else if (fromIndex >= saved.length && toIndex >= saved.length) {
      const arr = [...pending];
      const fi = fromIndex - saved.length;
      const ti = toIndex - saved.length;
      const [item] = arr.splice(fi, 1);
      const dropIdx = fi < ti ? ti - 1 : ti;
      arr.splice(dropIdx, 0, item);
      onPendingBlockFilesChange?.(block.id, { images: arr });
    }
  };

  const moveGalleryImage = (blockIndex, imgIndex, direction) => {
    const block = sortedBlocks[blockIndex];
    if (!block) return;
    const saved = block.data?.images || [];
    const pending = pendingBlockFiles[block.id]?.images || [];
    const newIdx = imgIndex + direction;
    if (newIdx < 0 || newIdx >= saved.length + pending.length) return;
    if (imgIndex < saved.length && newIdx < saved.length) {
      const arr = [...saved];
      [arr[imgIndex], arr[newIdx]] = [arr[newIdx], arr[imgIndex]];
      updateBlock(blockIndex, { data: { images: arr } });
    } else if (imgIndex >= saved.length && newIdx >= saved.length) {
      const pIdx = imgIndex - saved.length;
      const pNewIdx = newIdx - saved.length;
      const arr = [...pending];
      [arr[pIdx], arr[pNewIdx]] = [arr[pNewIdx], arr[pIdx]];
      onPendingBlockFilesChange?.(block.id, { images: arr });
    }
  };

  const clearBlockImage = (blockIndex) => {
    const block = sortedBlocks[blockIndex];
    if (!block) return;
    onPendingBlockFilesChange?.(block.id, null);
    updateBlock(blockIndex, { data: { url: '' } });
  };

  const getBlockImageDisplay = (block) => {
    const pending = pendingBlockFiles[block?.id]?.url;
    if (pending) return null;
    return block?.data?.url;
  };

  const getBlockImagePending = (block) => pendingBlockFiles[block?.id]?.url;

  return (
    <div className={styles.wrapper}>
      <div className={styles.blocksList}>
        {sortedBlocks.map((block, index) => (
          <div key={block.id}>
            <div
              className={styles.blockRow}
              data-block-row
              onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData('text/plain');
              const draggedIndex = parseInt(raw, 10);
              if (!Number.isNaN(draggedIndex) && draggedIndex !== index) {
                moveBlockByDrag(draggedIndex, index);
              }
            }}
          >
            <div className={styles.blockControls}>
              <div
                className={styles.dragHandle}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(index));
                  e.dataTransfer.effectAllowed = 'move';
                  const row = e.currentTarget.closest('[data-block-row]');
                  if (row) e.dataTransfer.setDragImage(row, 0, 0);
                }}
              >
                <GripVertical size={20} />
              </div>
              <div className={styles.moveButtons}>
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className={styles.moveBtn}
                  aria-label="Вверх"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === sortedBlocks.length - 1}
                  className={styles.moveBtn}
                  aria-label="Вниз"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <span className={styles.orderBadge}>{index + 1}</span>
            </div>

            <div className={styles.blockContent}>
              {block.type === 'heading' && (
                <>
                  <label className={styles.blockLabel}>Заголовок (якорь для навигации)</label>
                  <input
                    type="text"
                    value={block.data?.text ?? ''}
                    onChange={(e) => updateBlock(index, { data: { text: e.target.value } })}
                    className={styles.blockInput}
                    placeholder="Введите заголовок"
                  />
                </>
              )}

              {block.type === 'text' && (
                <>
                  <label className={styles.blockLabel}>Текстовый блок</label>
                  <RichTextEditor
                    value={block.data?.content ?? ''}
                    onChange={(v) => updateBlock(index, { data: { content: v } })}
                    placeholder="Введите текст..."
                    minHeight={200}
                  />
                </>
              )}

              {block.type === 'image' && (
                <>
                  <label className={styles.blockLabel}>Одна картинка</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileSelect(e, index)}
                    style={{ display: 'none' }}
                    id={`block-img-${block.id}`}
                  />
                  {(getBlockImageDisplay(block) || getBlockImagePending(block)) ? (
                    <div className={styles.imagePreview}>
                      {getBlockImagePending(block) ? (
                        <PendingImage file={getBlockImagePending(block)} />
                      ) : (
                        <img src={getImageUrl(block.data.url)} alt="" />
                      )}
                      <div className={styles.imageActions}>
                        <label htmlFor={`block-img-${block.id}`} className={styles.replaceBtn}>
                          Заменить
                        </label>
                        <button type="button" onClick={() => clearBlockImage(index)} className={styles.removeBtn}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor={`block-img-${block.id}`} className={styles.uploadArea}>
                      Загрузить изображение
                    </label>
                  )}
                </>
              )}

              {block.type === 'gallery' && (
                <>
                  <label className={styles.blockLabel}>Галерея картинок</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleGalleryFileSelect(e, index)}
                    style={{ display: 'none' }}
                    id={`block-gal-${block.id}`}
                  />
                  <label htmlFor={`block-gal-${block.id}`} className={styles.uploadArea}>
                    Добавить изображения в галерею
                  </label>
                  {(() => {
                    const saved = block.data?.images || [];
                    const pending = pendingBlockFiles[block.id]?.images || [];
                    const total = saved.length + pending.length;
                    if (total === 0) return null;
                    return (
                      <div className={styles.galleryPreview}>
                        {saved.map((img, i) => {
                          const isDragged = draggedGalleryImage?.blockIndex === index && draggedGalleryImage?.imgIndex === i;
                          const isDragOver = dragOverGalleryImage?.blockIndex === index && dragOverGalleryImage?.imgIndex === i;
                          return (
                          <div
                            key={`s-${i}`}
                            className={`${styles.galleryItemWrap} ${isDragged ? styles.galleryItemDragging : ''} ${isDragOver ? styles.galleryItemDragOver : ''}`}
                            draggable
                            onDragStart={(e) => {
                              setDraggedGalleryImage({ blockIndex: index, imgIndex: i });
                              e.dataTransfer.setData('text/plain', JSON.stringify({ blockIndex: index, imgIndex: i }));
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedGalleryImage(null);
                              setDragOverGalleryImage(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverGalleryImage({ blockIndex: index, imgIndex: i });
                            }}
                            onDragLeave={() => setDragOverGalleryImage((prev) => (prev?.blockIndex === index && prev?.imgIndex === i ? null : prev))}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const { blockIndex: bi, imgIndex: fi } = JSON.parse(e.dataTransfer.getData('text/plain'));
                                setDragOverGalleryImage(null);
                                if (bi !== index || fi === i) return;
                                moveGalleryImageTo(index, fi, i);
                              } catch (_) {}
                            }}
                          >
                            <div className={styles.galleryItem}>
                              <img src={getImageUrl(img)} alt="" />
                            </div>
                            <div className={styles.galleryActions}>
                              <div className={styles.imageDragHandle} title="Перетащите для изменения порядка">
                                <GripVertical size={18} />
                              </div>
                              <div className={styles.moveButtons}>
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(index, i, -1)}
                                  disabled={i === 0}
                                  className={styles.moveBtn}
                                  aria-label="Влево"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(index, i, 1)}
                                  disabled={i === saved.length - 1}
                                  className={styles.moveBtn}
                                  aria-label="Вправо"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                              <button type="button" onClick={() => removeGalleryImage(index, i)} className={styles.removeBtn} aria-label="Удалить" title="Удалить">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                        {pending.map((file, i) => {
                          const imgIdx = saved.length + i;
                          const isDragged = draggedGalleryImage?.blockIndex === index && draggedGalleryImage?.imgIndex === imgIdx;
                          const isDragOver = dragOverGalleryImage?.blockIndex === index && dragOverGalleryImage?.imgIndex === imgIdx;
                          return (
                          <div
                            key={`p-${i}`}
                            className={`${styles.galleryItemWrap} ${isDragged ? styles.galleryItemDragging : ''} ${isDragOver ? styles.galleryItemDragOver : ''}`}
                            draggable
                            onDragStart={(e) => {
                              setDraggedGalleryImage({ blockIndex: index, imgIndex: imgIdx });
                              e.dataTransfer.setData('text/plain', JSON.stringify({ blockIndex: index, imgIndex: imgIdx }));
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedGalleryImage(null);
                              setDragOverGalleryImage(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverGalleryImage({ blockIndex: index, imgIndex: imgIdx });
                            }}
                            onDragLeave={() => setDragOverGalleryImage((prev) => (prev?.blockIndex === index && prev?.imgIndex === imgIdx ? null : prev))}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const { blockIndex: bi, imgIndex: fi } = JSON.parse(e.dataTransfer.getData('text/plain'));
                                setDragOverGalleryImage(null);
                                if (bi !== index || fi === imgIdx) return;
                                moveGalleryImageTo(index, fi, imgIdx);
                              } catch (_) {}
                            }}
                          >
                            <div className={styles.galleryItem}>
                              <PendingImage file={file} />
                            </div>
                            <div className={styles.galleryActions}>
                              <div className={styles.imageDragHandle} title="Перетащите для изменения порядка">
                                <GripVertical size={18} />
                              </div>
                              <div className={styles.moveButtons}>
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(index, saved.length + i, -1)}
                                  disabled={i === 0}
                                  className={styles.moveBtn}
                                  aria-label="Влево"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(index, saved.length + i, 1)}
                                  disabled={i === pending.length - 1}
                                  className={styles.moveBtn}
                                  aria-label="Вправо"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                              <button type="button" onClick={() => removeGalleryImage(index, saved.length + i)} className={styles.removeBtn} aria-label="Удалить" title="Удалить">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}

              {block.type === 'quote' && (
                <>
                  <label className={styles.blockLabel}>Цитата</label>
                  <RichTextEditor
                    value={block.data?.content ?? ''}
                    onChange={(v) => updateBlock(index, { data: { content: v } })}
                    placeholder="Введите цитату..."
                    minHeight={120}
                  />
                </>
              )}

              {block.type === 'video' && (
                <>
                  <label className={styles.blockLabel}>Видео VK</label>
                  <p className={styles.hint}>
                    Вставьте ссылку из кода встраивания (атрибут <code>src</code> из iframe) или весь код iframe.
                  </p>
                  <input
                    type="text"
                    value={block.data?.url ?? ''}
                    onChange={(e) => handleVideoChange(e.target.value, index)}
                    className={styles.blockInput}
                    placeholder="https://vkvideo.ru/video_ext.php?..."
                  />
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeBlock(index)}
              className={styles.deleteBtn}
              title="Удалить блок"
              aria-label="Удалить блок"
            >
              <X size={18} />
            </button>
          </div>
          
          {index < sortedBlocks.length - 1 && (
            <div
              ref={(el) => {
                if (el) insertRefs.current[index] = el;
              }}
              className={`${styles.insertBlockArea} ${(hoveredInsertIndex === index || openInsertIndex === index) ? styles.insertBlockAreaVisible : ''}`}
              onMouseEnter={() => setHoveredInsertIndex(index)}
              onMouseLeave={() => {
                if (openInsertIndex !== index) {
                  setHoveredInsertIndex(null);
                }
              }}
              data-insert-index={index}
            >
            <div className={styles.insertLine} />
            <button
              type="button"
              className={styles.insertPlusBtn}
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = openInsertIndex === index ? null : index;
                setOpenInsertIndex(newIndex);
                if (newIndex !== null) {
                  // Расчет позиции после рендера
                  requestAnimationFrame(() => {
                    const position = calculateDropdownPosition(newIndex);
                    setDropdownPosition(prev => ({ ...prev, [newIndex]: position }));
                  });
                }
              }}
              aria-label="Добавить блок здесь"
              title="Добавить блок здесь"
            >
              <Plus size={20} />
            </button>
            {openInsertIndex === index && (
              <div 
                className={`${styles.insertDropdown} ${dropdownPosition[index] === 'top' ? styles.insertDropdownTop : styles.insertDropdownBottom}`}
                onMouseEnter={() => setHoveredInsertIndex(index)}
                onMouseLeave={() => {
                  if (openInsertIndex !== index) {
                    setHoveredInsertIndex(null);
                  }
                }}
              >
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    className={styles.addBlockOption}
                    onClick={() => addBlockAfter(index, type)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
          </div>
        ))}
        {sortedBlocks.length > 0 && (
          <div
            ref={(el) => {
              if (el) insertRefs.current[sortedBlocks.length - 1] = el;
            }}
            className={`${styles.insertBlockArea} ${(hoveredInsertIndex === sortedBlocks.length - 1 || openInsertIndex === sortedBlocks.length - 1) ? styles.insertBlockAreaVisible : ''}`}
            onMouseEnter={() => setHoveredInsertIndex(sortedBlocks.length - 1)}
            onMouseLeave={() => {
              if (openInsertIndex !== sortedBlocks.length - 1) {
                setHoveredInsertIndex(null);
              }
            }}
            data-insert-index={sortedBlocks.length - 1}
          >
            <div className={styles.insertLine} />
            <button
              type="button"
              className={styles.insertPlusBtn}
              onClick={(e) => {
                e.stopPropagation();
                const lastIndex = sortedBlocks.length - 1;
                const newIndex = openInsertIndex === lastIndex ? null : lastIndex;
                setOpenInsertIndex(newIndex);
                if (newIndex !== null) {
                  // Расчет позиции после рендера
                  requestAnimationFrame(() => {
                    const position = calculateDropdownPosition(newIndex);
                    setDropdownPosition(prev => ({ ...prev, [newIndex]: position }));
                  });
                }
              }}
              aria-label="Добавить блок здесь"
              title="Добавить блок здесь"
            >
              <Plus size={20} />
            </button>
            {openInsertIndex === sortedBlocks.length - 1 && (
              <div 
                className={`${styles.insertDropdown} ${dropdownPosition[sortedBlocks.length - 1] === 'top' ? styles.insertDropdownTop : styles.insertDropdownBottom}`}
                onMouseEnter={() => setHoveredInsertIndex(sortedBlocks.length - 1)}
                onMouseLeave={() => {
                  if (openInsertIndex !== sortedBlocks.length - 1) {
                    setHoveredInsertIndex(null);
                  }
                }}
              >
                {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    className={styles.addBlockOption}
                    onClick={() => addBlockAfter(sortedBlocks.length - 1, type)}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {sortedBlocks.length === 0 && (
      <div className={styles.addBlockWrap} ref={addBlockRef}>
        <button
          type="button"
          onClick={() => setAddBlockOpen(!addBlockOpen)}
          className={styles.addBlockBtn}
        >
          + Добавить блок
        </button>
        {addBlockOpen && (
          <div className={styles.addBlockDropdown}>
            {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                className={styles.addBlockOption}
                onClick={() => addBlock(type)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

    </div>
  );
}

export { slugFromText, BLOCK_TYPES };
