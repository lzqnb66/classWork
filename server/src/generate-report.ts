import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { writeFileSync } from "fs";
import * as path from "path";

// 简化创建函数
const font = "宋体";
const bodySize = 24; // 12pt
const headingSize = 32; // 16pt

function makeTitle(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({ text, bold: true, font, size: 48 }), // 24pt
    ],
  });
}

function makeMeta(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text, font, size: bodySize })],
  });
}

function makeHeading(text: string, level: any = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font, size: headingSize })],
  });
}

function makePara(text: string) {
  return new Paragraph({
    indent: { firstLine: 480 },
    spacing: { after: 120 },
    children: [new TextRun({ text, font, size: bodySize })],
  });
}

const paragraphs: Paragraph[] = [];

// 封面与基本信息
paragraphs.push(makeTitle("基于 Vue3/Vite 的移动端与管理端应用及 Express/MySQL 后端的设计与实现——软件生产实习项目报告"));
paragraphs.push(makeMeta("作者：实训项目组"));
paragraphs.push(makeMeta("指导老师：—"));
paragraphs.push(makeMeta("日期：" + new Date().toISOString().slice(0, 10)));

// 摘要
paragraphs.push(makeHeading("摘要"));
paragraphs.push(
  makePara(
    "本项目面向实际业务场景，构建了一个包含移动端应用（mobile-app）、管理端应用（admin-app）与服务端（server）的全栈系统。前端采用 Vue3 + Vite 架构，移动端使用 Vant 构建高质量的移动交互，管理端使用 Element Plus 提升后台效率；全局状态管理使用 Pinia，路由使用 Vue Router，数据可视化使用 ECharts。后端基于 Express 框架，结合 MySQL 数据库，整合 JWT 认证与 Multer 文件上传，采用 ORM（项目中包含 typeorm 与 sequelize 依赖，根据不同模块使用）进行数据访问。项目实现了用户登录认证、范围查询与高级查询、数据统计与图表展示、记录删除与数据导出、文件上传等核心功能，并在开发过程中解决了若干关键问题，包括移动端 Tabbar 刷新后激活态不同步、查询模块导致弹窗失效、路由重复定义造成状态异常等。本文详细阐述了项目的需求分析、架构设计、关键技术选型与实现细节，并从性能与安全、测试与部署等维度进行总结与反思，为后续实践与扩展给出方向。"
  )
);

// 关键词
paragraphs.push(makeHeading("关键词"));
paragraphs.push(
  makePara(
    "Vue3；Vite；Vant；Element Plus；Pinia；Vue Router；ECharts；Express；JWT；MySQL；Sequelize/TypeORM；Axios"
  )
);

// 引言
paragraphs.push(makeHeading("一、引言"));
paragraphs.push(
  makePara(
    "项目以实训为契机，围绕数据查询、统计与记录管理搭建了“移动端 + 管理端 + 服务端”的三端协同系统，目标是在真实的工程环境中完成从需求分析到上线验收的闭环，训练团队协作、工程化开发与问题定位能力，并沉淀可复用的架构与代码资产。"
  )
);

// 项目概述与目标
paragraphs.push(makeHeading("二、项目概述与目标"));
paragraphs.push(
  makePara(
    "在 f:\\Dm\\classWork\\classwork 下包含三个主要子项目：mobile-app（移动端应用）、admin-app（管理端应用）、server（服务端 API）。项目目标包括：功能实现（登录认证、范围/高级查询、统计图表、记录删除与导出、文件上传）、质量保障（性能、安全、稳定、可维护）、体验优化（移动端风格统一、管理端高效操作）。"
  )
);

// 需求分析
paragraphs.push(makeHeading("三、需求分析"));
paragraphs.push(
  makePara(
    "功能性需求：用户登录与鉴权；数据查询（范围与高级）；数据统计与展示；记录管理（删除与导出）；文件上传；前后端路由导航。非功能性需求：可靠性、性能、安全、可维护性。"
  )
);

// 技术选型与架构设计
paragraphs.push(makeHeading("四、技术选型与架构设计"));
paragraphs.push(
  makePara(
    "前端：Vue3 + Vite；移动端 Vant；管理端 Element Plus；状态管理 Pinia；路由 Vue Router；图表 ECharts；Axios 统一封装。后端：Express + MySQL；JWT 认证；Multer 文件上传；ORM（TypeORM/Sequelize）。系统架构：前端通过 Axios 调用后端 REST API，后端进行路由分发与鉴权。"
  )
);

// 详细设计与实现
paragraphs.push(makeHeading("五、详细设计与实现"));
paragraphs.push(
  makePara(
    "移动端：使用 Vant Tabbar 的 route 模式，以 van-tabbar 的 route 属性与 van-tabbar-item 的 to 属性让激活态与 Vue Router 自动同步；清理路由重复定义，避免刷新后激活态异常；RangeQuery.vue 通过 queryApi.advancedQuery 调用后端，并以 try/catch/finally 管理状态与错误，保证弹窗稳定。管理端：使用 Element Plus 构建表格、分页、表单与对话框，图表页使用 ECharts。服务端：Express 配置 cors、JWT 认证、Multer 上传；结合 ORM 与 MySQL 完成查询与统计。"
  )
);

// 关键问题与解决方案
paragraphs.push(makeHeading("六、关键问题与解决方案"));
paragraphs.push(
  makePara(
    "1）Tabbar 刷新后激活态不正确：采用 route 模式，清理路由重复定义，移除冗余 v-model/watch；2）查询模块导致弹窗失效与 Vue 警告：统一函数命名（executeQuery），正确处理 Axios 返回（response.data），用 try/catch/finally 保证状态复位；3）401 未授权统一处理：响应拦截器清理登录态并跳转登录，业务避免阻塞局部 UI。"
  )
);

// 性能优化与安全策略
paragraphs.push(makeHeading("七、性能优化与安全策略"));
paragraphs.push(
  makePara(
    "前端性能：按需引入与懒加载、构建优化、图表重绘控制；后端性能：索引与聚合优化、分页限制、适当缓存；安全：JWT 授权、参数校验与白名单、文件上传类型与大小限制、防 XSS/CSRF 的基本策略。"
  )
);

// 测试与验证
paragraphs.push(makeHeading("八、测试与验证"));
paragraphs.push(
  makePara(
    "功能测试覆盖登录、范围/高级查询、图表展示、删除与导出、文件上传、Tabbar 导航；异常用例包括错误参数、无权限访问与网络中断；接口联调通过 Postman/Thunder Client 验证；体验验证确保移动端与管理端交互流畅。"
  )
);

// 部署与运维
paragraphs.push(makeHeading("九、部署与运维"));
paragraphs.push(
  makePara(
    "前端使用 Vite 构建与静态部署；后端通过 TypeScript 编译并启动服务；环境变量由 dotenv 管理；生产环境关闭调试日志，区分 dev/prod 的 baseURL；记录访问与错误日志以便运维与问题定位。"
  )
);

// 项目创新与不足
paragraphs.push(makeHeading("十、项目创新与不足"));
paragraphs.push(
  makePara(
    "创新：三端协同的统一工程化实践，前端组件库与图表框架的组合使用，针对移动端路由激活与弹窗交互的稳定性进行了优化。不足：ORM 的统一性需进一步梳理；测试覆盖率有待提升；导出大数据量建议引入异步队列与断点续传。"
  )
);

// 结论
paragraphs.push(makeHeading("十一、结论"));
paragraphs.push(
  makePara(
    "项目完整实现了基于 Vue3/Vite 前端与 Express/MySQL 后端的三端协同系统，满足了实训中的功能与非功能目标；在实践中解决了 Tabbar 激活态不同步、查询模块弹窗失效与路由重复定义等关键问题，保证了系统稳定与体验。团队对现代前端工程、Node.js 服务端开发、数据库设计与优化、认证与安全有了全面理解。"
  )
);

// 参考文献
paragraphs.push(makeHeading("参考文献"));
paragraphs.push(
  makePara(
    "[1] Vue.js 官方文档；[2] Vite 官方文档；[3] Vant 官方文档；[4] Element Plus 官方文档；[5] ECharts 官方文档；[6] Express 官方文档；[7] MySQL 官方文档；[8] Axios 官方文档；[9] JWT 官方文档。"
  )
);

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 }, // 2.54cm 上下，3.17cm 左右近似
        },
      },
      children: paragraphs,
    },
  ],
});

(async () => {
  const outPath = path.resolve(__dirname, "..", "论文-软件生产实习项目报告.docx");
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outPath, buffer);
  console.log("Word 文档已生成：", outPath);
})();