# AI Infra Map 设计参考调研

调查日期：2026-10-22。范围：只读调查现成设计及可复用性，没有修改网站。

## 结论

建议采用 **Hooman Stack Atlas 的语义分层 + BEP 的真实连接追踪 + Bycroft 的逐层深入**。主地图先明确表达软件依赖，硬件与执行顺序提供独立视图。房间里的桌子、机柜、交换机不能直接承担概念分类。

证据边界：本报告读取了一手页面、可访问的发布 JavaScript 和公开仓库；没有在本任务中完成 WebGL 场景的逐项鼠标验收。下文的“页面已见”指实际返回的文本与控件；README 自述的交互明确标注，不能视为已实测。

## 1. Hooman Stack Atlas / LLM Atlas：最适合总地图

- [Stack Atlas](https://hooistheman.vercel.app/stack-atlas) 由协作调查核对为分层板设计，包含 application、GPU runtime、OS、VM、CPU、GPU hardware、kernel、interconnect 等层，以及 forward、memory、scheduling 路径。它强调运行机制，而不是摆放设备。
- [LLM Atlas](https://hooistheman.vercel.app/llm-atlas) 页面已见搜索、explode、isolate、标签开关、点击 inspector、Build / Adapt / Run 模式。
- 已读取其[入口脚本](https://hooistheman.vercel.app/llm-atlas/js/main.js)、[边数据](https://hooistheman.vercel.app/llm-atlas/js/data/edges.js)、[布局](https://hooistheman.vercel.app/llm-atlas/js/data/layout.js)、[模式路径](https://hooistheman.vercel.app/llm-atlas/js/data/modes.js)：内容、关系、布局分别定义；flow 与跨系统 link 有区分。
- 可借鉴语义分层、隔离和固定布局。其部分 flow 把算法变体和实现优化也串成顺序，我们仍需独立审定，不能复制技术关系。
- 代码可从站点读取，不等于已获得开放许可。本轮没有找到作者对应公开仓库或许可证；适合作为设计参考，不能声称可直接复用源码。

## 2. BEP / Ben Dicken Vera Rubin：适合硬件视图

- [BEP 目录](https://www.bepresearch.com/visualizations) 从芯片到托盘、机柜、数据中心；[实际工具](https://tools.bepresearch.com/rubin/) 页面已见 Superchip / Compute tray、exploded view、镜头预设和 CPU→memory→GPU 导览。
- [源仓库](https://github.com/bddicken/nvidia) README 描述 hover 显示连接、click pin、非遮挡标注、分步镜头和带方向路径；这些是项目自述，本轮没有把每项当成鼠标实测。
- 应借鉴“每条线有真实总线含义”，点 GPU 才显示 HBM / CPU / NVLink 等邻接对象；适合 GB300 子视图，不适合把所有数学概念挂在设备上。
- GitHub API license 字段为空，根目录清单没有 LICENSE；这不能证明所有文件都无许可。BEP 页面明确写的是获得作者许可。其[third-party notices](https://tools.bepresearch.com/rubin/THIRD_PARTY_NOTICES.txt) 对 Three.js 等依赖的许可不自动覆盖主体模型。当前应按需另获授权，不能直接称 MIT 模板。

## 3. The Open-Source AI Stack：适合分类与跨层概念

- [主页](https://www.open-source-ai.tech/) 已见由基础设施到协议的十层，以及放在侧面的五组跨层主题；点击层进入解释、项目和阅读资料。[About](https://www.open-source-ai.tech/about) 说明 glossary 的摘要、完整条目及相关层关联。
- 值得采用“主层 + 跨层”区别：量化、并行、观测不应硬塞进一个位置。默认只展示少量层，逐步展开知识点。
- [公开仓库](https://github.com/Beige-Coffee/open-source-ai) 可确认，license API 返回 404；本轮未确认可复用许可。它的内容也覆盖治理和资助，Model Atlas 无须照搬范围。

## 4. roadmap.sh AI Engineer：适合学习先修关系

- [页面](https://roadmap.sh/ai-engineer) 明确是循序学习路线，目标偏应用已有模型；不能把职业学习顺序当作 vLLM 执行图。
- 借鉴节点展开和学习进度，另设“学习路线”；如 GPU→HBM→KV cache→PagedAttention 是教学路线，不是数据经过这四个算子的意思。
- [仓库许可证](https://github.com/nilbuild/developer-roadmap/blob/master/license) 实际读取到限制再发布的条款，不是 MIT。可链接、借鉴思路，不应直接搬内容或地图文件。
- 本轮没有取得完整客户端地图交互，未将节点点击行为记为实测。

## 5. Brendan Bycroft LLM Visualization：适合模型局部放大

- [在线作品](https://bbycroft.net/llm)、[代码与说明](https://github.com/bbycroft/llm-viz)。在线入口本轮返回内容极少；仓库明确介绍三维 GPT 风格网络与小型有权重示例。
- 可借鉴几何形状承担数学含义：矩阵、层、张量具有对应物，放大后仍是同一对象。用于从“模型”深入 Attention / FFN 比进入虚构工作站更清楚。
- 仓库当前已提供 MIT；README 对个人主页和第三方资源另设例外。复用前按文件保留许可，不能把全部资产统一看作 MIT。旧的询问 license issue 不能替代当前 LICENSE。

## 6. Transformer Explainer：适合局部可实验知识点

- [在线作品](https://poloclub.github.io/transformer-explainer/)、[源仓库](https://github.com/poloclub/transformer-explainer)。README 自述浏览器内运行 GPT-2，可输入文字并观察内部操作，仓库为 MIT。
- 适合点击 Attention、采样后进入小实验，概念与输入输出一起出现。主地图不必同时运行这些实验；可按需加载，避免三维导航抢走学习任务。
- 本轮核验的是一手仓库说明和许可，未完成在线模型实验。

## 当前地图的问题

读取 `src/data/infra-map.mjs` 后可见：七个站点直接用任意三维坐标摆放；没有独立的有类型关系数据。`llm` 路径把 RMSNorm、Attention、SwiGLU 放在 prefill/decode 之前，再接 KV cache、PagedAttention、continuous batching。它把算子、执行阶段、状态和优化串成单线。媒体路径和多卡路径也混合原理与优化。即使摄像机更漂亮，知识位置仍不能说明关系。

## 建议的信息结构

### 视图 A：Stack，回答“依赖什么”

固定从上到下：请求与服务 → 执行与调度 → 模型与算法 → kernel 与通信 → GPU / HBM / 互联。层内按职责分区。并行、量化、LoRA 作为跨层覆盖，不伪装成后一执行阶段。MHA/GQA/MQA 是变体关系；FlashAttention 实现 attention；TP 切分计算和权重；这些边应有不同类型。

### 视图 B：Request，回答“发生了什么”

语言模型：请求入队 → 调度 → prefill → decode 循环 → 输出；从阶段展开具体模型算子。KV cache 是被读写的状态，以侧连表示；prefix cache 是复用关系；continuous batching 是调度策略。音视频生成独立呈现编码、去噪迭代、解码及 stage pipeline，不能混入同一条 LLM 直线。

### 视图 C：Hardware，回答“在哪发生、通过什么搬运”

板级位置根据公开设备布局；只连接可说明的 CPU、GPU、HBM、NVLink、PCIe、NIC。选中对象后高亮直接邻居，线上显示连接类型。GB300 是具体实现实例，不把训练/服务分类命名为某块物理设备。

### 交互与验收

- 三个视图共享 concept id，位置与边随视图切换；点击只展示定义、关系和原论文，继续打开已有概念页。
- 搜索定位；选中后只高亮上下游；可隔离子系统。默认不展示全部连线。
- 每条边声明 `depends-on`、`executes-before`、`reads/writes`、`implemented-by`、`variant-of` 或 `connected-by`；未知关系不画线。
- 首屏能回答“我在哪里、这层做什么、为什么相连”；保留二维/键盘入口，三维只承担层级展开与空间观察。
- 先验证一个请求和一个硬件子图，再扩到全站。保留模型图每个操作独立绘制的规则。

本报告只提出设计方向，没有产生或替换新 UI。
