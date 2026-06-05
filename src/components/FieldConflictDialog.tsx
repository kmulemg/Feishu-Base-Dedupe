/**
 * 字段冲突对比组件
 * 
 * 功能：
 * 1. 展示所有冲突字段的详细对比信息（优先展示）
 * 2. 允许用户手动选择需要保留的字段值
 * 3. 显示自动合并的字段（在冲突字段之后）
 */

import React, { useState } from 'react';
import type { DuplicateConflictAnalysis } from '../types';

interface FieldConflictDialogProps {
  conflictAnalyses: DuplicateConflictAnalysis[];
  onConfirmMerge: (resolvedConflicts: DuplicateConflictAnalysis[]) => void;
  onClose: () => void;
  processing: boolean;
}

/**
 * 字段冲突对比组件
 */
const FieldConflictDialog: React.FC<FieldConflictDialogProps> = ({
  conflictAnalyses,
  onConfirmMerge,
  onClose,
  processing,
}) => {
  // 为每个冲突字段存储用户选择
  const [resolvedConflicts, setResolvedConflicts] = useState<DuplicateConflictAnalysis[]>(
    conflictAnalyses.map(analysis => ({
      ...analysis,
      conflictFields: analysis.conflictFields.map(field => ({
        ...field,
        resolvedValue: field.values[0]?.value, // 默认选择第一个值
      })),
    }))
  );

  // 处理字段值选择
  const handleFieldSelect = (analysisIndex: number, fieldIndex: number, value: any) => {
    const newResolvedConflicts = [...resolvedConflicts];
    newResolvedConflicts[analysisIndex].conflictFields[fieldIndex].resolvedValue = value;
    setResolvedConflicts(newResolvedConflicts);
  };

  // 统计总冲突数
  const totalConflicts = resolvedConflicts.reduce(
    (sum, analysis) => sum + analysis.conflictFields.length,
    0
  );

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: 900, maxHeight: '85vh' }} onClick={(e) => e.stopPropagation()}>
        {/* 对话框头部 */}
        <div className="dialog__header">
          <h2 className="dialog__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, color: 'var(--color-warning)' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            字段冲突对比与选择
          </h2>
          <p className="dialog__description">
            检测到 {resolvedConflicts.length} 个重复记录，共 {totalConflicts} 个字段冲突需要手动选择
          </p>
        </div>

        {/* 对话框内容 */}
        <div className="dialog__content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {resolvedConflicts.map((analysis, analysisIndex) => (
            <div key={analysisIndex} style={{ marginBottom: 24 }}>
              {/* 重复记录标题 */}
              <div style={{ 
                padding: 12, 
                backgroundColor: 'var(--color-bg-secondary)', 
                borderRadius: 4,
                marginBottom: 12,
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    重复字段值: <code>{analysis.detectionCode}</code>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {analysis.records.length} 条重复记录
                  </span>
                  {analysis.hasConflicts && (
                    <span style={{ 
                      padding: '2px 8px', 
                      backgroundColor: 'var(--color-warning-bg)', 
                      color: 'var(--color-warning)', 
                      borderRadius: 4, 
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {analysis.conflictFields.length} 个冲突
                    </span>
                  )}
                </div>
              </div>

              {/* 冲突字段（优先展示） */}
              {analysis.conflictFields.map((conflict, fieldIndex) => (
                <div 
                  key={fieldIndex}
                  style={{ 
                    marginBottom: 16, 
                    padding: 0, 
                    border: '1px solid var(--color-border)', 
                    borderRadius: 8,
                    backgroundColor: 'var(--color-bg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* 字段标题 */}
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--color-warning-bg)', 
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-warning)' }}>
                      {conflict.fieldName}
                    </span>
                  </div>

                  {/* 字段值对比 */}
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {conflict.values.map((valueInfo, valueIndex) => (
                        <div
                          key={valueIndex}
                          onClick={() => handleFieldSelect(analysisIndex, fieldIndex, valueInfo.value)}
                          style={{
                            padding: 12,
                            border: '2px solid',
                            borderColor: conflict.resolvedValue === valueInfo.value ? 'var(--color-primary)' : 'var(--color-border)',
                            borderRadius: 8,
                            cursor: 'pointer',
                            backgroundColor: conflict.resolvedValue === valueInfo.value ? 'var(--color-primary-bg)' : 'var(--color-bg)',
                            transition: 'all 0.2s',
                            position: 'relative',
                          }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                            记录 {valueIndex + 1}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500, lineHeight: '1.5' }}>
                            {valueInfo.displayValue || '(空)'}
                          </div>
                          {conflict.resolvedValue === valueInfo.value && (
                            <div style={{ 
                              marginTop: 8, 
                              fontSize: 11, 
                              color: 'var(--color-primary)',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              已选择
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* 仅显示冲突字段，自动合并字段已隐藏 */}
            </div>
          ))}
        </div>

        {/* 对话框底部 */}
        <div className="dialog__footer">
          <button 
            className="btn btn--secondary"
            onClick={onClose}
            disabled={processing}
          >
            取消
          </button>
          <button 
            className="btn btn--primary"
            onClick={() => onConfirmMerge(resolvedConflicts)}
            disabled={processing}
          >
            {processing ? (
              <>
                <div className="loading__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                处理中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                确认合并
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldConflictDialog;