# 书目数据与呈现

数据采用UTF-8 JSON。`issues`按官网新到旧排列，`articles`保持对应目录顺序。日期值沿用已核验的出版社标注；区分检索日期与出版日期。`sourceCount`可填官网核验的条目数，不能用自己抓到的数量伪装独立核验。

```json
{
  "journal": "Example Journal",
  "journalZh": "示例期刊（可选）",
  "issn": "0000-0000",
  "retrieved": "2026-10-23",
  "scope": "最近3期；按官网已上线目录计，含在编期",
  "notes": ["中文题名为本次整理译文，非期刊官方译名。"],
  "issues": [
    {
      "id": "v12-i3",
      "label": "Vol.12 No.3",
      "date": "2026年9月",
      "status": "完整目录已核验 / 在编 / 部分缺失（按实际填写）",
      "sources": [{"label": "出版社目录", "url": "https://publisher.example/issue/12/3"}],
      "sourceCount": 1,
      "articles": [
        {
          "english": "Original English title",
          "chinese": "对应中文译题",
          "authors": "A. Author, B. Author, ... C. Author",
          "type": "研究论文",
          "number": "123456",
          "pages": "",
          "part": "",
          "doi": "",
          "url": "https://publisher.example/article/123456",
          "notes": "可选：作者名单为目录页显示形式"
        }
      ]
    }
  ]
}
```

没有已核验的ISSN、DOI、页码或作者时留空，不使用示例值代替。类型用中文，如研究论文、综述、社论、编委会、勘误、撤稿通知、其他。`id`在当前目录中唯一。同卷多个分册合并计卷时，在`articles.part`注明分册，并在`sources`列出全部分册来源。按期收集的同卷不同期分别建组。

渲染器拒绝空题名、空中文译题、非HTTP(S)论文链接、重复DOI/链接、重复组ID和条目数不匹配。因来源确实重复而有必要跨期列出的记录应在组的文字说明中交代，数据仅保留一份身份。目录不完整但仍需交付时，在状态和notes中写明，省略无法核实的sourceCount，不能伪称完整。
