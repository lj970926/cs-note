* -Wxxx: 开启xxx类型的警告，比如-Wall, -Wextra等
* -Werror：将所有warning视为error
* -Werror=xxx: 将某类型的warning视为error，例如-Werror=unused
* -Wno-error=xxx：Werror的反作用，主要用于将Werror加入的一批warning中的某个特定的warning排除
* -Wno-xxx: 压制xxx类型的警告，主要用于将-Wxxx开启的某类警告中的某个排除
>[!note] 这里有一个优先级的概念，更具体的选项优先级高于更通用的选项。例如，-Wno-error=unused-variable可以覆盖-Werror=unused的效果

