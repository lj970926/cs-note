# Definition
shell完成对输入的word划分后，会在实际执行命令之前尝试对每个word进行一系列的扩展，最终得到命令的每个实际输入word
# Category
按优先级：
1. Brace expansion: \file{1..3\} -> file1 file2 file3
2. Tilde expansion: ~/code -> /home/users/lj970926/code
3. Parameter expansion: $HOME -> "my_home"
4. Command substitution: $(command) -> "command std output"
5. Arithmetic expansion: $((2 + 3)) -> 5
6. Word spliting: 
7. Pathname expansion: /path/to/file* -> /path/to/file1 /path/to/file2 /path/to/file3