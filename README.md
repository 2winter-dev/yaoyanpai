# 我要验牌（PWA）
> 基于 **Trae SOLO 3.0** 开发

「我要验牌」是一款 **可离线使用的 PWA**，用于 **DIY 车牌并进行拟真预览**：支持蓝牌与绿牌（新能源小型/大型）规则输入、实时渲染模拟效果、历史记录堆叠浏览、以及一键生成可分享的“验牌卡片”（自带热梗文案：**牌没有问题！**）。

## 功能概览

- **车牌模拟**：蓝牌 / 绿牌（小型新能源 / 大型新能源），输入规则按真实场景限制字符
- **拟真细节**：真实宽高比、螺丝孔位、确认后展示车牌钉与银色帽（含省简称+首字母）
- **实时预览动效**：输入完成/回填时触发层次动画
- **历史记录**：本地持久化，支持“打牌式”堆叠展开与回填
- **分享导出**：生成分享卡片图片，支持保存图片与系统分享（可用则启用）
- **离线能力**：PWA manifest + Service Worker 缓存，断网仍可使用核心功能

## 预览截图

> 若仓库中存在 `preview/` 目录，可在此处引用截图：
>
> - `./preview/y1.png`
> - `./preview/y2.png`
> - `./preview/y3.png`

## 开发

```bash
yarn
yarn dev
```

## 构建（含 PWA 离线资源）

```bash
yarn build
yarn preview
```

## PWA 安装

- Chrome / Edge：地址栏右侧「安装」图标 → 安装到桌面
- iOS Safari：分享 → 添加到主屏幕

## 页面

- `/#/`：DIY 车牌 + 实时预览 + 底部输入条
- `/#/history`：查看历史（底部弹层堆叠展开、回填/删除/清空）
- `/#/share/:id`：分享卡片（保存图片/系统分享）

> 说明：为适配 GitHub Pages 的静态托管与刷新 404 问题，路由使用了 HashRouter。

## GitHub Pages 部署

- Vite 配置已使用 `base: './'`，资源路径为相对路径，适配 `/repo/` 子路径部署
- 推荐将构建产物输出到 `docs/`（或使用 GitHub Actions 直接发布 `dist/`）

## 关键目录（源码模式）

- `src/pages/*`：页面（Home / History / Share）
- `src/components/*`：组件（车牌预览、输入条、键盘、历史堆叠等）
- `src/lib/plate.ts`：车牌规则与校验（字符限制、长度、展示格式等）
- `src/lib/storage.ts`：历史记录本地存储（localStorage）
- `vite.config.ts`：PWA 配置（manifest、缓存策略、base）

