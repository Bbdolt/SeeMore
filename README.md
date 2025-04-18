![icon128](https://github.com/user-attachments/assets/41bc2008-1aa9-4023-8201-e4d44b6a7f9d)

### SeeMore
#### 初衷
在某系统中发现导入文件功能存在注入攻击提交修复后，程序员只是将导入的元素添加"display: none;"隐藏起来了，
但是这个功能还是存在，所以可以通过将"display: none;"删除达到显示导入功能（二次绕过）。这里在提供一思路，在第
三次修复后，程序员可能只是将页面对应的代码段删除，但是后端的api仍然存在，可以利用之前的数据包（可能需要修改Cookie）
进行重放攻击。但是如果每次都要去手动修改不可见元素为可见就太麻烦了还可能错过一些可利用的功能点，所以就做了这
个插件可以显示隐藏的可点击（重点）元素不会将一些无用的文本弹窗等显示出来造成页面的不美观，下面讲讲这个插件的
应用场景以及安装方法。

如果大家在使用过程中遇到了bug或一些没有成功显示的元素，可以提交到issues中，我会尽快完善匹配规则，感谢大家支持。

#### V1.0教程
1、这里以Webgoat靶场为例
![PixPin_2025-03-01_19-58-08](https://github.com/user-attachments/assets/afa45f56-03b9-4b30-b5f0-7fe1d6991b41)
2、点击 Show Hidden 即可，显示出隐藏的按钮。点击 recover 即可恢复之前的页面。
![PixPin_2025-03-01_20-00-28](https://github.com/user-attachments/assets/3e1ec965-591a-4eda-8d17-785f2d850df7)
3、安装教程，Google 打开 chrome://extensions/ 链接，开启开发者模式，点击"加载以解压的扩展程序"，选择下载解压后的文件夹导入即可。
![PixPin_2025-03-01_20-02-55](https://github.com/user-attachments/assets/0bdc4127-a3e2-43d9-96ae-56736e835015)
![PixPin_2025-03-01_20-03-24](https://github.com/user-attachments/assets/702b71e7-a3e1-43d4-a917-a18a5d6abe54)

#### V1.0.1更新
1、添加显示通过 <!-- 注释隐藏起来的可点击内容，这个页面存在隐藏的功能框
![image](https://github.com/user-attachments/assets/635304b6-a334-4efa-b049-1ac89db16186)
2、点击 Show Hidden 显示功能
![image](https://github.com/user-attachments/assets/04344bfc-1547-4f58-85ac-19ccb92711c8)

#### v1.0.2更新
修复部分bug（注释功能）

#### 案例补充
发现上传功能，可以上传任意后缀但是对于大多数文件不解析，但可以解析html文件
![image](https://github.com/user-attachments/assets/9b38fa55-b387-4b23-a8fa-6c1b1bfb5fa6)

#### v1.0.3更新（添加匹配规则）
这是某edu资产，在修改密码时直接放到了前端页面中并隐藏起来。
![image](https://github.com/user-attachments/assets/dd708352-65a5-4629-ae47-baa8c594340e)
我是如何发现的？
在修改密码时他会提示正确或错误，而且没有与服务器的任何交互我就尝试查看前端代码发现的，最后添加了一条新匹配规则。
![image](https://github.com/user-attachments/assets/7c388e5a-f842-472b-9eaf-516dbf794a35)

