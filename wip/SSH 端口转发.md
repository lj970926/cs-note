# 本地端口转发
使用`ssh -L` 命令
![[Pasted image 20241207145502.png]]
创建一个监听local_port的socket，将所有对local_port的转发通过ssh channel转发到ssh server，在由ssh server转发到对应的host_port，这里的host_port可以是和ssh server不同的另一条机器。
示例：
```bash
ssh -L 8080:localhost:33062 harttle@mysql.example.com
```
假设远程服务器` harttle@mysql.example.com` 上的33062端口运行着mysql的管理后端，但是防火墙限制了其外网的访问，只能通过ssh登录该机器。通过`ssh -L` 命令，可以在本地创建一个8080端口，所有都该端口的访问都将由ssh转发到ssh server，并由ssh server转发到localhost::33062端口问（这里的address是相对ssh server而言的）。这样，用户可以通过访问`https://localhost:8080` 访问远程的mysql 管理后端。
# 远程端口转发
使用`ssh -R` 命令进行远程端口转发，基本相当于上文`ssh -L` 的反向过程。主要用于本机向外部暴露某个服务。
![[Pasted image 20241207150933.png]]


