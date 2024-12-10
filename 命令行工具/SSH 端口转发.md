# 本地端口转发
使用`ssh -L` 命令
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241210160424.png)

创建一个监听local_port的socket，将所有对local_port的转发通过ssh channel转发到ssh server，在由ssh server转发到对应的host_port，这里的host_port可以是和ssh server不同的另一条机器。
* 示例：
```bash
ssh -L 8080:localhost:33062 harttle@mysql.example.com
```
假设远程服务器` harttle@mysql.example.com` 上的33062端口运行着mysql的管理后端，但是防火墙限制了其外网的访问，只能通过ssh登录该机器。通过`ssh -L` 命令，可以在本地创建一个8080端口，所有都该端口的访问都将由ssh转发到ssh server，并由ssh server转发到localhost::33062端口问（这里的address是相对ssh server而言的）。这样，用户可以通过访问`https://localhost:8080` 访问远程的mysql 管理后端。
# 远程端口转发
使用`ssh -R` 命令进行远程端口转发，基本相当于上文`ssh -L` 的反向过程。主要用于本机向外部暴露某个服务。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241210160453.png)


与`ssh -L` 不用的是，`ssh -R` 会在ssh server侧开启一个端口，并监听所有对该远程端口的访问，将这些访问转发到local addr的local port端口。
* 示例：
```bash
ssh -R 8080:localhost:32400 harttle@example.com
```
假设本地的32400端口上有一个mysql的管理后端，通过上述`ssh -R` 命令，可以在ssh server，即`example.com` 上开启8080端口，ssh server会监听所有对该端口的访问并转发到本地的32400端口。通过这种方式，外部用户可以通过`example.com:8080` 访问mysql管理后端。
# 动态(SOCKS)端口转发
`ssh -D` 命令可以利用ssh创建一个动态application-level proxy。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241210160551.png)

ssh 默认使用SOCKS协议，监听port端口，并转发所有对该端口的访问。该转发的目的地址将由使用的应用层协议（socks)决定。
* 示例：
```bash
ssh -D localhost:8080 harttle@example.com
```
将在8080端口创建一个socks proxy.