import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const siteDir = path.join(root, "_site");

function stripFrontMatter(source) {
  return source.replace(/^---[\s\S]*?---\s*/, "");
}

function parseFrontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  const data = {};

  if (!match) {
    return data;
  }

  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    data[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }

  return data;
}

function renderLiquidBasics(source, page = {}) {
  const title = page.title ? `${page.title} | Jacob Sutton` : "Home | Jacob Sutton";
  const description = page.description || "Portfolio, writing, and basketball data work by Jacob Sutton.";

  return source
    .replaceAll("{{ site.lang | default: 'en' }}", "en")
    .replaceAll("{{ page.description | default: site.description }}", description)
    .replaceAll("{% if page.title %}{{ page.title }} | {% endif %}{{ site.title }}", title)
    .replaceAll("{{ '/' | relative_url }}", "/")
    .replaceAll("{{ '/assets/css/main.css' | relative_url }}", "/assets/css/main.css")
    .replaceAll("{{ '/assets/js/site.js' | relative_url }}", "/assets/js/site.js");
}

const layout = await readFile(path.join(root, "_layouts", "default.html"), "utf8");
const navigation = [
  '<a href="/#basketball">Basketball</a>',
  '<a href="/#work">Work</a>',
  '<a href="/#writing">Writing</a>',
  '<a href="/#reading">Reading</a>',
  '<a href="/#about">About</a>',
  '<a href="https://github.com/JSuttHoops">GitHub</a>',
].join("\n        ");

function renderDefault(content, page) {
  return renderLiquidBasics(layout, page)
  .replace(/        {% for item in site\.data\.navigation %}[\s\S]*?        {% endfor %}/, `        ${navigation}`)
    .replace("    {{ content }}", content.trim());
}

function renderArticleLayout(content, page) {
  let articleLayout = stripFrontMatter(articleLayoutSource);

  articleLayout = articleLayout
    .replace(/      {% if page\.kicker %}[\s\S]*?      {% endif %}/, page.kicker ? `      <p class="article-kicker">${page.kicker}</p>` : "")
    .replace(/      {% if page\.subtitle %}[\s\S]*?      {% endif %}/, page.subtitle ? `      <p class="article-subtitle">${page.subtitle}</p>` : "")
    .replace(/        {% if page\.author_url %}[\s\S]*?        {% endif %}/, page.author_url ? `        <a href="${page.author_url}">${page.author || ""}</a>` : `        ${page.author || ""}`)
    .replace("{% if page.date_label %}<span>{{ page.date_label }}</span>{% endif %}", page.date_label ? `<span>${page.date_label}</span>` : "")
    .replace("{% if page.status %}<span>{{ page.status }}</span>{% endif %}", page.status ? `<span>${page.status}</span>` : "")
    .replaceAll("{{ page.title }}", page.title || "")
    .replace("      {{ content }}", content.trim());

  return articleLayout;
}

await mkdir(siteDir, { recursive: true });

const indexSource = await readFile(path.join(root, "index.md"), "utf8");
const indexHtml = renderDefault(stripFrontMatter(indexSource), parseFrontMatter(indexSource));
await writeFile(path.join(siteDir, "index.html"), indexHtml);

const articleLayoutSource = await readFile(path.join(root, "_layouts", "article.html"), "utf8");
const articleSource = await readFile(path.join(root, "writing", "narrative-economics-nba.html"), "utf8");
const articlePage = parseFrontMatter(articleSource);
const articleContent = renderArticleLayout(stripFrontMatter(articleSource), articlePage);
const articleHtml = renderDefault(articleContent, articlePage);
const articleDir = path.join(siteDir, "writing", "narrative-economics-nba");
await mkdir(articleDir, { recursive: true });
await writeFile(path.join(articleDir, "index.html"), articleHtml);

await cp(path.join(root, "assets"), path.join(siteDir, "assets"), { recursive: true, force: true });

console.log(`Preview written to ${siteDir}`);
