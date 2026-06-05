/**
 * 冲突对话框组件
 * 
 * 功能：
 * 1. 展示所有重复的字段值
 * 2. 让用户选择合并策略（覆盖/保留/合并）
 * 3. 执行合并操作
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DuplicateResult, MergeStrategy } from '../types';

interface ConflictDialogProps {
  duplicates: DuplicateResult[];
  fieldName: string;
  onMerge: (strategy: MergeStrategy) => void;
  onClose: () => void;
  processing: boolean;
}

/**
 * 冲突对话框组件
 */
const ConflictDialog: React.FC<ConflictDialogProps> = ({
  duplicates,
  fieldName,
  onMerge,
  onClose,
  processing,
}) => {
  const { t } = useTranslation();
  const [selectedStrategy, setSelectedStrategy] = useState<MergeStrategy>('merge');

  // 策略选项
  const strategies = [
    {
      value: 'overwrite' as MergeStrategy,
      label: t('dialog.conflict.overwrite'),
      desc: t('dialog.conflict.overwrite.desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
    },
    {
      value: 'keep' as MergeStrategy,
      label: t('dialog.conflict.keep'),
      desc: t('dialog.conflict.keep.desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      ),
    },
    {
      value: 'merge' as MergeStrategy,
      label: t('dialog.conflict.merge'),
      desc: t('dialog.conflict.merge.desc'),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="18" r="3"/>
          <circle cx="6" cy="6" r="3"/>
          <path d="M6 21V9a9 9 0 0 0 9 9"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        {/* 对话框头部 */}
        <div className="dialog__header">
          <h2 className="dialog__title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, color: 'var(--color-warning)' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {t('dialog.conflict.title')}
          </h2>
          <p className="dialog__description">
            {t('dialog.conflict.description')}
          </p>
        </div>

        {/* 对话框内容 */}
        <div className="dialog__content">
          {/* 冲突列表 */}
          <div className="duplicate-list">
            {duplicates.slice(0, 5).map((dup, index) => (
              <div key={index} className="conflict-card">
                <div className="conflict-card__header">
                  <span>{fieldName}:</span>
                  <code style={{ marginLeft: 8, fontWeight: 600 }}>{dup.code}</code>
                  <span className="conflict-card__badge">{dup.records.length} {t('stats.records')}</span>
                </div>
                <div className="conflict-card__content">
                  <div className="conflict-card__data">
                    <div className="conflict-card__label">{t('dialog.conflict.existing')}</div>
                    <div className="conflict-card__value">
                      recordId: {dup.records[0]?.recordId.substring(0, 8)}...
                    </div>
                  </div>
                  <div className="conflict-card__data">
                    <div className="conflict-card__label">{t('dialog.conflict.new')}</div>
                    <div className="conflict-card__value">
                      {dup.records.slice(1).map((r, i) => (
                        <div key={i}>recordId: {r.recordId.substring(0, 8)}...</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {duplicates.length > 5 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                ... 还有 {duplicates.length - 5} 个冲突
              </p>
            )}
          </div>

          {/* 策略选择 */}
          <div className="strategy-list">
            <h4 style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              {t('dialog.conflict.strategy')}
            </h4>
            
            {strategies.map((strategy) => (
              <div
                key={strategy.value}
                className={`strategy-item ${selectedStrategy === strategy.value ? 'strategy-item--selected' : ''}`}
                onClick={() => setSelectedStrategy(strategy.value)}
              >
                <div className="strategy-item__radio" />
                <div className="strategy-item__content">
                  <div className="strategy-item__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {strategy.icon}
                    {strategy.label}
                  </div>
                  <div className="strategy-item__desc">{strategy.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 对话框底部 */}
        <div className="dialog__footer">
          <button 
            className="btn btn--secondary"
            onClick={onClose}
            disabled={processing}
          >
            {t('button.cancel')}
          </button>
          <button 
            className="btn btn--primary"
            onClick={() => onMerge(selectedStrategy)}
            disabled={processing}
          >
            {processing ? (
              <>
                <div className="loading__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Processing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13"/>
                  <path d="M8 12h13"/>
                  <path d="M8 18h13"/>
                  <path d="M3 6h.01"/>
                  <path d="M3 12h.01"/>
                  <path d="M3 18h.01"/>
                </svg>
                {t('button.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictDialog;
