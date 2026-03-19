# 第七章：/ship——从代码到产品的最后一英里

## 发布不是终点，是新起点

在传统软件公司，发布是什么？

**一个紧张的仪式。**

- 团队熬夜到凌晨
- 一遍遍检查清单
- 祈祷不要出问题
- 准备回滚计划
- 发布后不敢睡觉

为什么？因为**发布是高风险操作**。

在 gstack 里，`/ship`改变了什么？

**发布变成日常操作。**

每天发布 10 次，像喝水一样自然。

这不是魔法，是**系统化的发布准备**。

### 测试引导：没有测试框架？自动创建

`/ship`第一件事：**确保有测试**。

但很多项目没有测试框架：
- 新项目还没设置
- 遗留项目从未有测试
- 个人项目觉得"太麻烦"

`/ship`解决了这个问题：

#### 自动检测

```
/shipping 启动。

检测项目类型：
- package.json → Node.js
- Gemfile → Ruby/Rails  
- pom.xml → Java/Maven
- requirements.txt → Python
- composer.json → PHP

检测测试框架：
- jest, vitest, mocha → JavaScript
- rspec, minitest → Ruby
- pytest, unittest → Python
- JUnit → Java

未找到测试框架。
```

#### 自动引导

```
未找到测试框架。需要引导吗？

A) 引导完整测试堆栈（推荐）
   - 安装测试运行器
   - 配置覆盖率报告
   - 添加示例测试
   - 集成 CI 脚本

B) 只安装测试运行器
   - 最小化设置
   - 不配置覆盖率
   - 不添加示例

C) 跳过 — 手动处理测试

RECOMMENDATION: A — 完整引导确保长期可维护性。
```

#### 引导内容

如果选择 A，`/ship`会：

1. **安装依赖**
   ```bash
   # Node.js 示例
   npm install --save-dev jest @types/jest ts-jest
   ```

2. **创建配置文件**
   ```javascript
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     collectCoverageFrom: ['src/**/*.{js,ts}'],
     coverageThreshold: {
       global: { branches: 80, functions: 80, lines: 80 }
     }
   };
   ```

3. **添加示例测试**
   ```typescript
   // src/__tests__/example.test.ts
   describe('Example', () => {
     it('should work', () => {
       expect(true).toBe(true);
     });
   });
   ```

4. **更新 package.json**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```

5. **添加 CI 配置**
   ```yaml
   # .github/workflows/test.yml
   name: Test
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm test -- --coverage
   ```

**结果：** 项目现在有完整的测试基础设施。

### 覆盖审计：ASCII 代码路径图

`/ship`要求**覆盖审计**。

不是"有测试吗？"，而是"**每个代码路径都测试了吗？**"

#### ASCII 路径图

`/ship`生成 ASCII 图显示代码路径和测试覆盖：

```
函数: processPayment(amount, currency)

路径 1: 正常流程
  validateInput() → callStripe() → createOrder() → return success
  测试: ✅ payment_service_test.rb:42

路径 2: 输入无效  
  validateInput() → throw ValidationError
  测试: ✅ payment_service_test.rb:58

路径 3: Stripe 失败
  validateInput() → callStripe() → throw StripeError
  测试: ❌ 未覆盖

路径 4: 订单创建失败
  validateInput() → callStripe() → createOrder() → throw DBError  
  测试: ❌ 未覆盖

缺口: 2/4 路径未测试
建议: 添加 Stripe 失败和 DB 失败测试
```

#### 覆盖规则

- **每个分支**必须有测试
- **每个异常路径**必须有测试  
- **每个边界情况**必须有测试
- **每个集成点**必须有模拟测试

**任何缺口都是发布阻塞。**

### 审查门控：Review Readiness Dashboard

`/ship`集成了**审查就绪仪表板**。

这是 gstack 的核心概念：**门禁控制**。

#### 仪表板内容

```
+====================================================================+
|                    审查就绪仪表板                                   |
+====================================================================+
| 审查            | 运行次数 | 最后运行           | 状态      | 必需   |
|-----------------|------|---------------------|-----------|--------|
| Eng Review      |  1   | 2026-03-19 10:30    | CLEAR     | YES    |
| CEO Review      |  1   | 2026-03-19 09:15    | CLEAR     | no     |
| Design Review   |  0   | —                   | —         | no     |
| QA              |  1   | 2026-03-19 11:00    | CLEAR     | YES    |
| Codex Review    |  0   | —                   | —         | no     |
+--------------------------------------------------------------------+
| 测试覆盖        | 当前: 78% | 目标: 80%       | 缺口: 2%  | YES    |
| 文档            | README 更新? ✓          | ARCHITECTURE 更新? ✗ | 部分   |
+--------------------------------------------------------------------+
| 结论：BLOCKED — 文档未完全更新，测试覆盖不足                      |
+====================================================================+
```

#### 门禁规则

- **必需审查**：Eng Review、QA、测试覆盖
- **信息性审查**：CEO Review、Design Review（根据上下文推荐）
- **文档要求**：README 和关键架构文档必须更新

**只有所有必需项通过，才能发布。**

### 文档自动化：/document-release 协同

`/ship`与`/document-release`协同工作。

#### 自动文档更新

当`/ship`检测到代码变更影响文档时：

```
检测到文档更新需求：

1. README.md — 功能描述需要更新
   当前："支持基本支付功能"
   建议："支持 Stripe、PayPal、Apple Pay 支付"

2. ARCHITECTURE.md — 新增支付服务组件
   需要添加架构图和组件描述

3. API_DOCS.md — 新增 /api/payments 端点
   需要添加端点文档

运行 /document-release 自动更新？
→ A) 是，自动更新所有文档
→ B) 只更新 README
→ C) 跳过，手动更新
```

#### 文档质量检查

`/document-release`确保文档质量：

- **示例代码**：所有代码示例必须可运行
- **截图更新**：UI 截图必须匹配当前实现
- **链接验证**：所有内部/外部链接有效
- **术语一致**：使用项目统一术语

**低质量文档会被拒绝。**

### 发布清单：系统化的最后检查

`/ship`执行**发布清单**。

这不是静态清单，是动态生成的。

#### 清单生成

基于项目类型和变更内容：

```
Node.js + Web 应用发布清单：

□ 测试通过（单元、集成、E2E）
□ 覆盖率 ≥ 80%
□ 构建成功（npm run build）
□ 生产构建无错误
□ 环境变量验证
□ 数据库迁移向后兼容
□ 功能标志正确设置
□ 监控告警配置
□ 回滚计划文档化
□ 操作手册更新
□ 用户文档更新
□ 性能基准测试通过
□ 安全扫描通过
□ 依赖版本锁定
□ Docker 镜像构建成功
□ Kubernetes 配置验证
```

#### 自动验证

`/ship`自动验证每个项目：

```
验证测试通过... ✓
验证覆盖率 ≥ 80%... ✗ (当前 78%)
验证构建成功... ✓  
验证环境变量... ✓
...

缺口: 覆盖率不足 (78% < 80%)
建议: 运行 /qa --exhaustive 提升覆盖率
```

### 版本管理：语义化版本自动化

`/ship`处理**版本管理**。

#### 自动版本建议

基于变更内容分析：

```
分析变更类型：

- feat: 添加新支付网关支持
- fix: 修复并发支付竞态条件  
- perf: 优化数据库查询性能
- docs: 更新用户文档

检测到 feat 提交 → 建议次要版本升级

当前版本: 1.2.3
建议版本: 1.3.0

确认版本升级？
→ A) 1.3.0 (次要版本)
→ B) 2.0.0 (主要版本)  
→ C) 1.2.4 (补丁版本)
→ D) 自定义版本
```

#### CHANGELOG 自动生成

基于提交历史生成 CHANGELOG：

```markdown
## [1.3.0] - 2026-03-19

### Added
- 支持 PayPal 和 Apple Pay 支付网关

### Fixed  
- 修复并发支付导致的重复收费问题

### Performance
- 优化数据库查询，减少 50% 响应时间

### Documentation
- 更新用户文档和 API 参考
```

### 部署自动化：一键发布

`/ship`支持多种部署目标：

#### 本地部署

```bash
# 自动检测部署脚本
npm run deploy:local
# 或
./deploy.sh local
```

#### 云部署

```bash
# Vercel
vercel --prod

# Netlify  
netlify deploy --prod

# AWS Amplify
amplify push --y

# Heroku
git push heroku main
```

#### 容器部署

```bash
# Build and push Docker image
docker build -t myapp:1.3.0 .
docker push myapp:1.3.0

# Deploy to Kubernetes
kubectl set image deployment/myapp myapp=myapp:1.3.0
```

#### 自动检测

`/ship`自动检测部署配置：

- `vercel.json` → Vercel
- `netlify.toml` → Netlify  
- `Dockerfile` → 容器部署
- `Procfile` → Heroku
- `k8s/` 目录 → Kubernetes

### 回滚准备：安全网

`/ship`确保**回滚准备就绪**。

#### 回滚清单

```
回滚准备检查：

□ 当前版本备份完成
□ 数据库迁移可逆
□ 配置回滚脚本存在
□ 回滚测试通过
□ 回滚联系人列表更新
□ 回滚时间窗口确认

所有项目通过 ✓
```

#### 自动回滚脚本

如果缺失，`/ship`生成回滚脚本：

```bash
#!/bin/bash
# rollback-v1.3.0.sh

echo "回滚到 v1.2.3..."

# 回滚数据库迁移
npm run migrate:down

# 回滚代码
git checkout v1.2.3

# 重新部署
npm run deploy

# 验证回滚
npm run test:e2e

echo "回滚完成！"
```

### 实战案例：支付功能发布

让我详细讲个案例。

#### 初始状态

团队完成了新支付功能：
- 支持多支付网关
- 修复了竞态条件
- 添加了完整测试
- 更新了文档

他们准备发布。

#### /ship 的介入

```
你：/ship

/shipping 启动。

检测项目：Node.js + React
检测测试框架：Jest + React Testing Library ✓
检测部署目标：Vercel (vercel.json 存在)

审查就绪仪表板：
- Eng Review: CLEAR ✓
- CEO Review: CLEAR ✓  
- QA: CLEAR ✓
- 测试覆盖: 85% ✓
- 文档: README 更新 ✓, ARCHITECTURE 更新 ✓

发布清单验证：
- 测试通过 ✓
- 构建成功 ✓
- 环境变量验证 ✓
- 数据库迁移兼容 ✓
- 功能标志设置 ✓
- 监控配置 ✓
- 回滚计划 ✓

版本分析：
- feat: 添加多支付网关支持
- fix: 修复并发支付问题
- 建议版本: 1.3.0

确认发布 v1.3.0 到生产环境？
→ A) 是
→ B) 先发布到 staging
→ C) 取消
```

#### 发布过程

```
选择 A) 是

执行发布：

1. 运行最终测试... ✓
2. 构建生产版本... ✓  
3. 生成 CHANGELOG... ✓
4. 更新版本号... ✓
5. 提交版本变更... ✓
6. 推送到 GitHub... ✓
7. 触发 Vercel 部署... ✓
8. 监控部署进度...
   - 构建中... 
   - 部署中...
   - 验证中...
   - 成功！✅

发布完成！

URL: https://myapp.vercel.app
版本: v1.3.0
时间: 2026-03-19 14:30:22

回滚命令: vercel rollback --yes
```

#### 发布后验证

```
/shipping 自动运行发布后验证：

1. 访问生产 URL... ✓
2. 检查控制台错误... ✓  
3. 验证核心功能... ✓
4. 检查监控指标... ✓
5. 验证日志记录... ✓

所有验证通过！

健康分数: 96/100 (之前 94/100)

[发布报告保存到 .gstack/ship-reports/]
```

### 我的建议：如何最大化/ship 的价值

#### 建议 1：不要跳过审查门禁

即使你觉得"这个简单，可以直接发布"。

**让系统确保一切就绪。**

门禁不是障碍，是保护。

#### 建议 2：使用自动文档更新

不要手动更新文档。

**让 `/document-release` 自动同步。**

这确保文档始终准确。

#### 建议 3：信任自动版本管理

不要手动决定版本号。

**让系统基于变更内容建议。**

这确保语义化版本一致性。

#### 建议 4：always prepare rollback

永远不要假设发布会成功。

**让 `/ship` 确保回滚准备就绪。**

这是专业发布的标志。

### 结语：发布的民主化

传统发布是专家活动：
- 需要专门的 DevOps 团队
- 发布是高压力事件
- 错误成本极高
- 频率很低（每周/每月）

`/ship` 使发布民主化：
- 任何开发者都能安全发布
- 发布是日常操作
- 错误成本极低
- 频率很高（每天多次）

**这不是"自动化部署"，是"系统化发布保证"。**

在 AI 时代，发布的边际成本趋近于零。

**高质量发布成为默认，而不是例外。**

所以，频繁发布。

运行 `/ship`。

---

**下一章：15 个角色的协同作战**

我们会讲解：
- 角色全景图
- 工件驱动的上下文传递
- 并行 Sprint 管理
- 实战案例：一个功能的完整生命周期
