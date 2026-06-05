/**
 * 中文翻译
 */

export default {
  // 标题
  'app.title': '重复数据检测与合并',
  
  // 说明文字
  'app.description': '检测当前表格中的指定字段是否重复，并提供数据合并方案',
  'app.noFieldFound': '未找到指定字段，请确认表格中是否存在该字段',
  'app.noRecords': '当前表格暂无数据',
  'app.loading': '正在加载数据...',
  'app.analyzing': '正在分析数据...',
  
  // 按钮
  'button.check': '开始检测',
  'button.refresh': '刷新',
  'button.merge': '合并数据',
  'button.cancel': '取消',
  'button.confirm': '确认',
  'button.close': '关闭',
  
  // 检测结果
  'result.title': '检测结果',
  'result.total': '总记录数',
  'result.duplicate': '重复记录数',
  'result.unique': '唯一记录数',
  'result.noDuplicate': '未发现重复数据',
  'result.foundDuplicate': '发现 {count} 个重复字段值',
  
  // 冲突对话框
  'dialog.conflict.title': '数据冲突',
  'dialog.conflict.description': '检测到以下字段值存在重复：',
  'dialog.conflict.existing': '已有数据',
  'dialog.conflict.new': '新数据',
  'dialog.conflict.strategy': '请选择处理方式',
  'dialog.conflict.overwrite': '覆盖',
  'dialog.conflict.overwrite.desc': '用新数据完全覆盖已有数据',
  'dialog.conflict.keep': '保留',
  'dialog.conflict.keep.desc': '保留已有数据，忽略新数据',
  'dialog.conflict.merge': '合并',
  'dialog.conflict.merge.desc': '合并两个数据，保留所有非空字段',
  
  // 统计信息
  'stats.records': '条记录',
  'stats.duplicates': '个重复',
  'stats.unique': '个唯一',
  
  // 成功提示
  'success.mergeComplete': '数据合并完成',
  'success.noConflicts': '数据无冲突，无需合并',
  
  // 错误提示
  'error.loadFailed': '加载数据失败',
  'error.mergeFailed': '合并数据失败',
  'error.unknown': '发生未知错误',
  
  // 空状态
  'empty.title': '暂无数据',
  'empty.description': '请先在多维表格中添加数据',
  
  // 字段
  'field.detectionCode': '检测字段',
  'field.selectField': '选择需要检查的重复字段',
};