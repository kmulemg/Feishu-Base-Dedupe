/**
 * 主应用组件
 * 
 * 功能：
 * 1. 自动选择表格第一列作为检测字段
 * 2. 获取表格中所有记录
 * 3. 检测重复的字段值
 * 4. 显示检测结果
 * 5. 处理数据合并
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { bitable } from '@lark-base-open/js-sdk';
import { useTheme } from './hooks/useTheme';
import ConflictDialog from './components/ConflictDialog';
import FieldConflictDialog from './components/FieldConflictDialog';
import type { DetectionRecord, DuplicateResult, MergeStrategy, DuplicateConflictAnalysis, FieldConflict, MergeLog } from './types';

// 字段类型接口
interface FieldMeta {
  id: string;
  name: string;
  type: number;
}

// 只读字段类型列表（无法通过API修改）
const READ_ONLY_FIELD_TYPES = new Set([
  19,  // Lookup - 查找引用
  20,  // Formula - 公式
  1001, // CreatedTime - 创建时间
  1002, // ModifiedTime - 修改时间
  1003, // CreatedUser - 创建人
  1004, // ModifiedUser - 修改人
  1005, // AutoNumber - 自动编号
]);

/**
 * 检查字段是否为只读字段
 */
function isReadOnlyField(fieldType: number): boolean {
  return READ_ONLY_FIELD_TYPES.has(fieldType);
}

/**
 * 从字段值中提取字符串表示
 * 处理不同类型的字段值（字符串、对象、数组等）
 */
function extractFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // 如果是字符串，直接返回
  if (typeof value === 'string') {
    return value;
  }
  
  // 如果是数字，转换为字符串
  if (typeof value === 'number') {
    return String(value);
  }
  
  // 如果是对象，尝试提取值
  if (typeof value === 'object') {
    // 处理数组
    if (Array.isArray(value)) {
      return value.map(item => extractFieldValue(item)).join(', ');
    }
    
    // 处理对象类型的字段值（如单选、多选等）
    // 常见的格式有：{ text: 'xxx' } 或 { value: 'xxx' }
    if ('text' in value) {
      return String(value.text);
    }
    if ('value' in value) {
      return String(value.value);
    }
    if ('name' in value) {
      return String(value.name);
    }
    
    // 其他对象类型尝试 JSON 序列化
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  
  // 其他类型
  return String(value);
}

/**
 * 主应用组件
 */
function App() {
  const { t } = useTranslation();
  useTheme(); // 使用但不读取 theme 值
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState<string>('');
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [records, setRecords] = useState<DetectionRecord[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([]);
  const [conflictAnalyses, setConflictAnalyses] = useState<DuplicateConflictAnalysis[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<DuplicateConflictAnalysis[]>([]); // 保存所有分析结果
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showFieldConflictDialog, setShowFieldConflictDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processing, setProcessing] = useState(false);

  // 初始化：自动选择表格第一列作为检测字段
  useEffect(() => {
    initPlugin();
  }, []);

  /**
   * 初始化插件
   */
  const initPlugin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 检查是否在多维表格环境中运行
      if (typeof bitable === 'undefined') {
        throw new Error('Not running in Base environment');
      }
      
      // 获取活动表格
      const table = await bitable.base.getActiveTable();
      
      // 优先使用当前视图的字段顺序；table.getFieldMetaList() 返回的是无序列表。
      const tableFieldMetaList = await table.getFieldMetaList();
      let fieldMetaList = tableFieldMetaList;

      try {
        const view = await table.getActiveView();
        const visibleFieldIds = await view.getVisibleFieldIdList();
        const fieldById = new Map(tableFieldMetaList.map(field => [field.id, field]));
        const visibleFields = visibleFieldIds
          .map(id => fieldById.get(id))
          .filter((field): field is FieldMeta => Boolean(field));

        if (visibleFields.length > 0) {
          fieldMetaList = visibleFields;
        }
      } catch (viewErr) {
        console.warn('获取当前视图字段顺序失败，使用表格字段列表:', viewErr);
      }
      
      setFields(fieldMetaList);
      
      // 自动选择当前视图第一列作为检测字段
      if (fieldMetaList.length > 0) {
        const firstField = fieldMetaList[0];
        setFieldId(firstField.id);
        setFieldName(firstField.name);
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('初始化失败:', err);
      // 设置更友好的错误信息
      if (err instanceof Error) {
        if (err.message.includes('Not running in Base environment')) {
          setError('请在多维表格中运行此插件');
        } else {
          setError(`初始化失败: ${err.message}`);
        }
      } else {
        setError('初始化失败，请检查插件配置');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 手动选择字段
   */
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFieldId = e.target.value;
    if (selectedFieldId) {
      const field = fields.find(f => f.id === selectedFieldId);
      if (field) {
        setFieldId(field.id);
        setFieldName(field.name);
        setError(null);
      }
    } else {
      setFieldId(null);
      setFieldName('');
    }
  };

  /**
   * 检测重复数据
   */
  const checkDuplicates = async () => {
    if (!fieldId) {
      showToast('请先选择需要检查的重复字段', 'error');
      return;
    }
    
    setAnalyzing(true);
    setDuplicates([]);
    setError(null);
    
    try {
      const table = await bitable.base.getActiveTable();
      const fieldMetaList = await table.getFieldMetaList();
      
      // 分页获取所有记录
      const fetchedRecords: DetectionRecord[] = [];
      const processedRecordIds = new Set<string>();
      let pageToken: string | undefined;

      do {
        const result = await table.getRecords({
          pageSize: 5000,
          pageToken,
        });
        const batchRecords = result.records || [];
        
        for (const record of batchRecords) {
          if (!record || typeof record !== 'object') continue;
          
          const recordFields = (record as any).fields || {};
          const recordId = (record as any).recordId || '';
          
          // 记录级别去重：确保每个 recordId 只处理一次
          if (!recordId || processedRecordIds.has(recordId)) {
            continue;
          }
          processedRecordIds.add(recordId);
          
          const rawValue = recordFields[fieldId];
          
          // 正确处理不同类型的字段值
          const detectionCode = extractFieldValue(rawValue);
          
          fetchedRecords.push({
            recordId,
            detectionCode: String(detectionCode).trim(),
            fields: recordFields as Record<string, any>,
          });
        }
        
        pageToken = result.hasMore ? result.pageToken : undefined;
      } while (pageToken);

      if (fetchedRecords.length === 0) {
        setError(t('app.noRecords'));
        setAnalyzing(false);
        return;
      }
      
      setRecords(fetchedRecords);
      
      // 检测重复
      const codeMap = new Map<string, DetectionRecord[]>();
      
      for (const record of fetchedRecords) {
        if (!record.detectionCode) continue;
        
        const existing = codeMap.get(record.detectionCode) || [];
        existing.push(record);
        codeMap.set(record.detectionCode, existing);
      }
      
      // 筛选出重复的
      const duplicateResults: DuplicateResult[] = [];
      
      codeMap.forEach((recs, code) => {
        if (recs.length > 1) {
          // 排序：让字段数据更完整的记录排在前面（作为主记录）
          const sortedRecords = [...recs].sort((a, b) => {
            const countA = Object.values(a.fields).filter(v => v && (typeof v !== 'string' || v.trim() !== '')).length;
            const countB = Object.values(b.fields).filter(v => v && (typeof v !== 'string' || v.trim() !== '')).length;
            return countB - countA;
          });
          duplicateResults.push({ code, records: sortedRecords });
        }
      });
      
      setDuplicates(duplicateResults);
      
      // 分析冲突
      const analyses = await analyzeConflicts(duplicateResults, fieldMetaList);
      setAllAnalyses(analyses); // 保存所有分析结果
      
      // 过滤出有冲突的记录用于显示
      const conflictAnalyses = analyses.filter(a => a.hasConflicts);
      setConflictAnalyses(conflictAnalyses);
      
      // 如果有重复，检查是否有冲突
      if (duplicateResults.length > 0) {
        if (conflictAnalyses.length > 0) {
          // 有冲突，显示字段冲突对比对话框（只显示有冲突的记录）
          setShowFieldConflictDialog(true);
        } else {
          // 无冲突，直接执行合并
          await executeSmartMerge(analyses);
        }
      }
    } catch (err) {
      console.error('检测重复失败:', err);
      if (err instanceof Error) {
        setError(`检测失败: ${err.message}`);
      } else {
        setError(t('error.loadFailed'));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * 智能冲突分析
   * 区分无冲突字段和冲突字段
   */
  const analyzeConflicts = async (
    duplicates: DuplicateResult[],
    fieldMetaList: FieldMeta[]
  ): Promise<DuplicateConflictAnalysis[]> => {
    const analyses: DuplicateConflictAnalysis[] = [];
    
    for (const duplicate of duplicates) {
      const analysis: DuplicateConflictAnalysis = {
        detectionCode: duplicate.code,
        records: duplicate.records,
        autoMergeFields: {},
        conflictFields: [],
        hasConflicts: false,
      };
      
      // 收集所有字段
      const allFields = new Set<string>();
      duplicate.records.forEach(record => {
        Object.keys(record.fields).forEach(fieldId => allFields.add(fieldId));
      });
      
      // 分析每个字段
      for (const fieldId of allFields) {
        const fieldMeta = fieldMetaList.find(f => f.id === fieldId);
        const fieldName = fieldMeta?.name || fieldId;
        const fieldType = fieldMeta?.type || 0;
        
        // 跳过只读字段（无法通过API修改）
        if (isReadOnlyField(fieldType)) {
          continue;
        }
        
        // 收集该字段在所有记录中的值
        const values: {
          recordId: string;
          value: any;
          displayValue: string;
        }[] = [];
        
        duplicate.records.forEach(record => {
          const value = record.fields[fieldId];
          const displayValue = extractFieldValue(value);
          values.push({
            recordId: record.recordId,
            value,
            displayValue,
          });
        });
        
        // 过滤有效值（非空）
        const validValues = values.filter(v => 
          v.value !== null && 
          v.value !== undefined && 
          (typeof v.value !== 'string' || v.value.trim() !== '') &&
          (!Array.isArray(v.value) || v.value.length > 0)
        );
        
        if (validValues.length === 0) {
          // 所有值都为空，跳过
          continue;
        } else if (validValues.length === 1) {
          // 只有一个有效值，自动合并
          analysis.autoMergeFields[fieldId] = validValues[0].value;
        } else {
          // 多个有效值，检查是否冲突
          const uniqueValues = new Set(validValues.map(v => v.displayValue));
          
          if (uniqueValues.size === 1) {
            // 所有有效值相同，自动合并
            analysis.autoMergeFields[fieldId] = validValues[0].value;
          } else {
            // 存在冲突，需要手动选择
            const conflict: FieldConflict = {
              fieldId,
              fieldName,
              fieldType,
              values: validValues,
              hasConflict: true,
            };
            analysis.conflictFields.push(conflict);
            analysis.hasConflicts = true;
          }
        }
      }
      
      analyses.push(analysis);
    }
    
    return analyses;
  };

  /**
   * 处理确认合并（包含用户选择的冲突字段值）
   */
  const handleConfirmMerge = async (resolvedConflicts: DuplicateConflictAnalysis[]) => {
    // 将用户选择的冲突字段值合并到所有分析结果中
    const mergedAnalyses = allAnalyses.map(analysis => {
      // 查找是否有对应的冲突解决
      const resolvedAnalysis = resolvedConflicts.find(
        r => r.detectionCode === analysis.detectionCode
      );
      
      if (resolvedAnalysis) {
        // 使用用户解决的冲突值
        return {
          ...analysis,
          conflictFields: resolvedAnalysis.conflictFields,
          hasConflicts: resolvedAnalysis.hasConflicts,
        };
      }
      
      // 没有冲突的记录，保持原样
      return analysis;
    });
    
    // 执行合并
    await executeSmartMerge(mergedAnalyses);
  };

  /**
   * 执行智能合并
   */
  const executeSmartMerge = async (analyses: DuplicateConflictAnalysis[]) => {
    if (!fieldId || analyses.length === 0) return;
    
    setProcessing(true);
    
    try {
      const table = await bitable.base.getActiveTable();
      const logs: MergeLog[] = [];
      
      for (const analysis of analyses) {
        const primaryRecord = analysis.records[0];
        const recordsToMerge = analysis.records.slice(1);
        
        // 记录合并前的字段状态
        const beforeFields = { ...primaryRecord.fields };
        
        // 合并字段：自动合并字段 + 用户选择的冲突字段值
        const mergedFields: Record<string, any> = {
          ...analysis.autoMergeFields,
        };
        
        // 记录手动解决的冲突
        const manualResolveFields: Record<string, { from: any; to: any }> = {};
        
        // 添加用户选择的冲突字段值
        analysis.conflictFields.forEach(conflict => {
          if (conflict.resolvedValue !== undefined) {
            mergedFields[conflict.fieldId] = conflict.resolvedValue;
            
            // 记录从哪个值变到哪个值
            const originalValue = beforeFields[conflict.fieldId];
            if (originalValue !== conflict.resolvedValue) {
              manualResolveFields[conflict.fieldId] = {
                from: originalValue,
                to: conflict.resolvedValue,
              };
            }
          }
        });
        
        // 更新主记录
        await table.setRecord(primaryRecord.recordId, {
          fields: mergedFields,
        });
        
        // 删除所有待合并的记录（只删除一次）
        if (recordsToMerge.length > 0) {
          const recordIdsToDelete = recordsToMerge.map(r => r.recordId);
          await table.deleteRecords(recordIdsToDelete);
        }
        
        // 创建合并日志
        const log: MergeLog = {
          timestamp: new Date().toISOString(),
          detectionCode: analysis.detectionCode,
          primaryRecordId: primaryRecord.recordId,
          mergedRecordIds: recordsToMerge.map(r => r.recordId),
          autoMergeFields: analysis.autoMergeFields,
          manualResolveFields,
          totalFieldsMerged: Object.keys(analysis.autoMergeFields).length + Object.keys(manualResolveFields).length,
          totalConflictsResolved: Object.keys(manualResolveFields).length,
        };
        
        logs.push(log);
      }
      
      showToast('合并完成！', 'success');
      setShowFieldConflictDialog(false);
      
      // 重新检测以更新数据
      setTimeout(() => {
        checkDuplicates();
      }, 1000);
    } catch (err) {
      console.error('合并失败:', err);
      if (err instanceof Error) {
        showToast(`合并失败: ${err.message}`, 'error');
      } else {
        showToast('合并失败，请重试', 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  /**
   * 处理合并操作
   */
  const handleMerge = async (strategy: MergeStrategy) => {
    if (!fieldId || duplicates.length === 0) return;
    
    setProcessing(true);
    
    try {
      const table = await bitable.base.getActiveTable();
      // 获取字段元数据列表，用于判断字段类型
      const fieldMetaList = await table.getFieldMetaList();
      
      // 创建字段类型映射 { fieldId: FieldType }
      const fieldTypeMap = new Map<string, number>();
      fieldMetaList.forEach(field => {
        fieldTypeMap.set(field.id, field.type);
      });
      
      for (const duplicate of duplicates) {
        // 第一条记录作为主记录
        const primaryRecord = duplicate.records[0];
        // 其他记录需要合并
        const recordsToMerge = duplicate.records.slice(1);
        
        // 初始化合并字段（以主记录为基础）
        let mergedFields: Record<string, any> = { ...primaryRecord.fields };
        
        switch (strategy) {
          case 'overwrite':
            // 覆盖策略：使用最后一条记录的数据覆盖
            if (recordsToMerge.length > 0) {
              const lastRecord = recordsToMerge[recordsToMerge.length - 1];
              mergedFields = { ...lastRecord.fields };
            }
            break;
            
          case 'keep':
            // 保留策略：保持主记录不变，跳过删除
            continue;
            
          case 'merge':
            // 合并策略：遍历所有待合并记录，填充主记录的空字段
            for (const record of recordsToMerge) {
              for (const [key, value] of Object.entries(record.fields)) {
                // 跳过只读字段
                const fieldType = fieldTypeMap.get(key);
                if (fieldType !== undefined && isReadOnlyField(fieldType)) {
                  continue;
                }
                
                const primaryValue = mergedFields[key];
                
                // 检查新值是否有效
                let isValueValid = false;
                if (value !== null && value !== undefined) {
                  if (typeof value === 'string') {
                    isValueValid = value.trim() !== '';
                  } else if (Array.isArray(value)) {
                    isValueValid = value.length > 0;
                  } else if (typeof value === 'object') {
                    isValueValid = Object.keys(value).length > 0;
                  } else {
                    isValueValid = true;
                  }
                }
                
                if (!isValueValid) continue;
                
                // 如果主记录字段为空，直接赋值
                if (!primaryValue || 
                    (typeof primaryValue === 'string' && primaryValue.trim() === '') ||
                    (Array.isArray(primaryValue) && primaryValue.length === 0)) {
                  mergedFields[key] = value;
                } 
                // 只有多选字段（FieldType.MultiSelect = 4）才进行数组合并
                else if (Array.isArray(primaryValue) && Array.isArray(value)) {
                  // FieldType.MultiSelect = 4，只有多选字段才合并数组
                  if (fieldType === 4) {
                    const mergedArray = [...new Set([...primaryValue, ...value])];
                    mergedFields[key] = mergedArray;
                  }
                }
                // 对于其他类型（字符串、数字等），保留主记录的值，不合并
              }
            }
            break;
            
          default:
            continue;
        }
        
        // 更新主记录
        await table.setRecord(primaryRecord.recordId, {
          fields: mergedFields,
        });
        
        // 删除所有待合并的记录（只删除一次）
        if (recordsToMerge.length > 0) {
          const recordIdsToDelete = recordsToMerge.map(r => r.recordId);
          await table.deleteRecords(recordIdsToDelete);
        }
      }
      
      showToast(t('success.mergeComplete'), 'success');
      
      setShowConflictDialog(false);
      
      setTimeout(() => {
        checkDuplicates();
      }, 500);
      
    } catch (err) {
      console.error('合并失败:', err);
      if (err instanceof Error) {
        showToast(`合并失败: ${err.message}`, 'error');
      } else {
        showToast(t('error.mergeFailed'), 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  /**
   * 显示提示消息
   */
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 渲染错误状态
  if (error && !loading && !analyzing) {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="header__title">{t('app.title')}</h1>
          <p className="header__description">{t('app.description')}</p>
        </div>
        
        <div className="empty-state">
          <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3 className="empty-state__title">{t('error.loadFailed')}</h3>
          <p className="empty-state__description">{error}</p>
          <button className="btn btn--primary" onClick={initPlugin} style={{ marginTop: 16 }}>
            {t('button.refresh')}
          </button>
        </div>
      </div>
    );
  }

  // 渲染加载状态
  if (loading) {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="header__title">{t('app.title')}</h1>
          <p className="header__description">{t('app.description')}</p>
        </div>
        
        <div className="loading">
          <div className="loading__spinner"></div>
          <p>{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  // 渲染分析状态
  if (analyzing) {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="header__title">{t('app.title')}</h1>
          <p className="header__description">{t('app.description')}</p>
        </div>
        
        <div className="loading">
          <div className="loading__spinner"></div>
          <p>{t('app.analyzing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 标题区域 */}
      <div className="header">
        <h1 className="header__title">{t('app.title')}</h1>
        <p className="header__description">{t('app.description')}</p>
      </div>

      {/* 字段选择 */}
      <div className="card">
        <div className="card__title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <path d="M9 12h6"/>
            <path d="M9 16h6"/>
          </svg>
          {t('field.selectField')}
        </div>
        <div className="card__content">
          <select 
            value={fieldId || ''} 
            onChange={handleFieldChange}
            className="field-select"
            style={{
              padding: '8px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              minWidth: '200px',
            }}
          >
            <option value="">请选择字段</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
          {fieldName && (
            <span style={{ color: 'var(--color-text-secondary)', marginLeft: 12 }}>
              当前选择: <strong>{fieldName}</strong>
              {records.length > 0 && ` (${records.length} ${t('stats.records')})`}
            </span>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="toolbar">
        <button 
          className="btn btn--primary" 
          onClick={checkDuplicates}
          disabled={!fieldId}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          {t('button.check')}
        </button>
        
        <button 
          className="btn btn--secondary" 
          onClick={initPlugin}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6"/>
            <path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {t('button.refresh')}
        </button>
      </div>

      {/* 检测结果 */}
      {duplicates.length > 0 && (
        <div className="card">
          <div className="card__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {t('result.title')}
          </div>
          
          {/* 统计信息 */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card__value">{records.length}</div>
              <div className="stat-card__label">{t('result.total')}</div>
            </div>
            <div className="stat-card stat-card--warning">
              <div className="stat-card__value">{duplicates.length}</div>
              <div className="stat-card__label">{t('result.duplicate')}</div>
            </div>
            <div className="stat-card stat-card--success">
              <div className="stat-card__value">
                {records.length - duplicates.reduce((sum, d) => sum + d.records.length, 0) + duplicates.length}
              </div>
              <div className="stat-card__label">{t('result.unique')}</div>
            </div>
          </div>
          
          {/* 重复列表 */}
          <div className="duplicate-list">
            <h4 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              {t('result.foundDuplicate', { count: duplicates.length })}
            </h4>
            
            {duplicates.slice(0, 10).map((dup, index) => (
              <div key={index} className="duplicate-item">
                <span className="duplicate-item__code">{dup.code}</span>
                <span className="duplicate-item__count">
                  {dup.records.length} {t('stats.records')}
                </span>
              </div>
            ))}
            
            {duplicates.length > 10 && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                ... 还有 {duplicates.length - 10} 个重复
              </p>
            )}
          </div>
          
          {/* 合并按钮 */}
          <div style={{ marginTop: 16 }}>
            <button 
              className="btn btn--success"
              onClick={() => setShowConflictDialog(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6h13"/>
                <path d="M8 12h13"/>
                <path d="M8 18h13"/>
                <path d="M3 6h.01"/>
                <path d="M3 12h.01"/>
                <path d="M3 18h.01"/>
              </svg>
              {t('button.merge')}
            </button>
          </div>
        </div>
      )}

      {/* 无重复时显示成功信息 */}
      {duplicates.length === 0 && records.length > 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-success)' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3 className="empty-state__title" style={{ color: 'var(--color-success)' }}>
              {t('result.noDuplicate')}
            </h3>
            <p className="empty-state__description">
              {records.length} {t('stats.records')}，{t('result.unique')}
            </p>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {fields.length > 0 && !fieldId && (
        <div className="card">
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <h3 className="empty-state__title">{t('empty.title')}</h3>
            <p className="empty-state__description">{t('field.selectField')}</p>
          </div>
        </div>
      )}

      {/* 冲突对话框 */}
      {showConflictDialog && fieldId && (
        <ConflictDialog
          duplicates={duplicates}
          fieldName={fieldName}
          onMerge={handleMerge}
          onClose={() => setShowConflictDialog(false)}
          processing={processing}
        />
      )}

      {/* 字段冲突对比对话框 */}
      {showFieldConflictDialog && conflictAnalyses.length > 0 && (
        <FieldConflictDialog
          conflictAnalyses={conflictAnalyses}
          onConfirmMerge={handleConfirmMerge}
          onClose={() => setShowFieldConflictDialog(false)}
          processing={processing}
        />
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
