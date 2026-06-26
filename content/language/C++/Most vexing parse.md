<iframe src="https://en.wikipedia.org/wiki/Most_vexing_parse" allow="fullscreen" allowfullscreen="" style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>

https://en.wikipedia.org/wiki/Most_vexing_parse

主要是针对类似下面的初始化：
```c++
TimeKeeper time_keeper(Timer());
```
上面的代码按照正常的意图都是用一个Timer类型的临时对象初始化一个TimerKeeper类型的对象，但是按照C++规范上面这行实际上被解析成了一个time_keeper函数的声明。关键在于C++允许函数变量名加括号（包括类似上面的匿名变量）