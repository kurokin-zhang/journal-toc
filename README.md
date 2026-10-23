# 期刊目录 · journal-toc

给出英文期刊名和范围，收集出版社完整目录，按卷期生成英文原题与中文译题对照，保留作者、文章号、类型与原文链接。

## 使用

把本仓库放入个人 Codex 技能目录下的 `journal-toc` 文件夹，保留 `SKILL.md`、`agents`、`references` 和 `scripts` 的目录结构。

调用示例：

```text
期刊目录 Environmental Impact Assessment Review 最近5期
期刊目录 Land Use Policy 2024—2026年
期刊目录 Journal of Rural Studies 2025全年
期刊目录 Environmental Impact Assessment Review 117卷
$journal-toc Sustainable Cities and Society 最近3期，只要研究论文
```

最近N期、指定卷期、卷号区间和指定年份均可。按期出版的刊物区分卷与期；分册不当作独立卷。指定年份按出版社卷期标注年份筛选，提前上线与在编状态会明确说明。

## 输出

- Markdown：完整中英文目录。
- 单文件HTML：中英文与作者搜索、卷期及类型筛选、打印。
- JSON：可复用书目数据。

收集默认保留研究论文、综述、社论、编委会和勘误等目录条目。中文题名是整理译文，并非期刊官方译名。不下载或分发论文全文。

## Obsidian归档

向助手提供目标笔记路径后，目录按以下层级保存，已有期刊、年份和用户批注予以保留，同期数据增量补充，避免重复收录：

```markdown
# 英文期刊名

[中英文导览](附件/期刊_卷期范围_检索日期.html)

## 出版年份

### 卷期

#### 1. 中文译题

English: Original English title

作者、类型、文章号或页码、原文链接
```

HTML保存在笔记同目录的“附件”文件夹，笔记使用相对链接。更新后创建新HTML并保留旧快照。公开版不包含任何个人笔记路径、真实书目数据或账号凭据。

## 导览生成器

完成采集与翻译后，按 [数据结构](references/catalog-format.md) 准备JSON，再运行：

```text
node scripts/render_catalog.mjs catalog.json output-directory
```

需要Node.js，无额外包依赖。生成器检查空题名、缺失译文、无效链接、重复身份及条目数不匹配；它只负责校验与呈现，不代替联网采集或翻译。输出目录已有同名成品时会停止，以防覆盖。

实际采集需要可用的联网或浏览器读取工具。源站无法完整访问时，应明确缺失范围，不把搜索摘要或部分记录称为完整目录。
