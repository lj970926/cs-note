# 新建空白配置
```bash
pre-commit sample-config &> .pre-commit-config.yaml
```
# C++配置
* clang-format:
```yaml
- repo: https://github.com/pre-commit/mirrors-clang-format
    rev: v18.1.8
    hooks:
    - id: clang-format
      types_or: [c++, cuda]
      args: [--style=file, --verbose]
```
