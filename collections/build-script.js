import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 复制构建文件到 collections-static 目录
const clientDir = path.join(__dirname, 'dist', 'client');
const serverDir = path.join(__dirname, 'dist', 'server');
const targetDir = path.join(__dirname, '..', 'collections-static');

// 清理并重建目标目录
if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
}
fs.mkdirSync(targetDir, { recursive: true });

// 由于使用SSR，我们需要复制服务器文件到collections-static
// 复制服务器端文件
const serverFiles = ['_noop-actions.mjs', '_noop-middleware.mjs', 'renderers.mjs'];
serverFiles.forEach(file => {
    const srcPath = path.join(serverDir, file);
    const targetPath = path.join(targetDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, targetPath);
        console.log(`✓ ${file} 已复制`);
    }
});

// 复制manifest文件（动态文件名）
const manifestFiles = fs.readdirSync(serverDir).filter(file => file.startsWith('manifest_'));
manifestFiles.forEach(file => {
    const srcPath = path.join(serverDir, file);
    const targetPath = path.join(targetDir, file);
    fs.copyFileSync(srcPath, targetPath);
    console.log(`✓ ${file} 已复制`);
});

// 复制chunks和pages目录
const dirsToSync = ['chunks', 'pages'];
dirsToSync.forEach(dir => {
    const srcDir = path.join(serverDir, dir);
    const targetDirPath = path.join(targetDir, dir);
    if (fs.existsSync(srcDir)) {
        if (fs.existsSync(targetDirPath)) {
            fs.rmSync(targetDirPath, { recursive: true, force: true });
        }
        fs.cpSync(srcDir, targetDirPath, { recursive: true });
        console.log(`✓ ${dir} 目录已复制`);
    }
});

// 复制客户端资源
// 复制 _astro 目录
const astroSrcDir = path.join(clientDir, '_astro');
const astroTargetDir = path.join(targetDir, '_astro');

if (fs.existsSync(astroSrcDir)) {
    try {
        // 删除旧的 _astro 目录
        if (fs.existsSync(astroTargetDir)) {
            fs.rmSync(astroTargetDir, { recursive: true, force: true });
        }
        
        // 复制新的 _astro 目录
        fs.cpSync(astroSrcDir, astroTargetDir, { recursive: true });
        console.log('✓ _astro 资源已复制');
    } catch (error) {
        console.log('警告：_astro 目录复制失败，可能是文件被占用');
        console.log('请手动复制 collections/dist/client/_astro 到 collections-static/_astro');
    }
}

// 复制 logo.png
const logoSrc = path.join(clientDir, 'logo.png');
const logoTarget = path.join(targetDir, 'logo.png');

if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, logoTarget);
    console.log('✓ logo.png 已复制');
}

// 复制 favicon.svg
const faviconSrc = path.join(clientDir, 'favicon.svg');
const faviconTarget = path.join(targetDir, 'favicon.svg');

if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, faviconTarget);
    console.log('✓ favicon.svg 已复制');
}

// 复制 images 目录
const imagesSrcDir = path.join(clientDir, 'images');
const imagesTargetDir = path.join(targetDir, 'images');

if (fs.existsSync(imagesSrcDir)) {
    try {
        // 删除旧的 images 目录
        if (fs.existsSync(imagesTargetDir)) {
            fs.rmSync(imagesTargetDir, { recursive: true, force: true });
        }
        
        // 复制新的 images 目录
        fs.cpSync(imagesSrcDir, imagesTargetDir, { recursive: true });
        console.log('✓ images 目录已复制');
    } catch (error) {
        console.log('警告：images 目录复制失败');
    }
}

// 生成静态的collections.html文件
generateStaticCollectionsHtml();

// 为每个集合生成单独的静态HTML文件
const collectionsDataPath = path.join(__dirname, 'src/data/collections.json');
const collectionsData = JSON.parse(fs.readFileSync(collectionsDataPath, 'utf8'));
const { categories, collections } = collectionsData;

// 平台图标和名称映射
const platformMap = {
    '115': { name: '115网盘', icon: 'fa-box', color: 'bg-orange-500' },
    '123': { name: '123网盘', icon: 'fa-hashtag', color: 'bg-green-500' },
    'mobile': { name: '移动云盘', icon: 'fa-mobile-alt', color: 'bg-blue-500' },
    'xunlei': { name: '迅雷云盘', icon: 'fa-bolt', color: 'bg-yellow-500' },
    'aliyun': { name: '阿里云盘', icon: 'fa-cloud', color: 'bg-purple-500' },
    'uc': { name: 'UC网盘', icon: 'fa-compass', color: 'bg-red-500' },
    'tianyi': { name: '天翼云盘', icon: 'fa-cloud', color: 'bg-pink-500' },
    'quark': { name: '夸克网盘', icon: 'fa-search', color: 'bg-indigo-500' },
    'others': { name: '其他网盘', icon: 'fa-ellipsis-h', color: 'bg-gray-500' },
    'baidu': { name: '百度网盘', icon: 'fa-database', color: 'bg-blue-600' }
};

collections.forEach(collection => {
    generateStaticCollectionHtml(collection, categories, platformMap);
});

// 生成静态的go.html文件
generateStaticGoHtml();

function generateStaticCollectionsHtml() {
    try {
        // 读取集合数据
        const collectionsDataPath = path.join(__dirname, 'src/data/collections.json');
        const collectionsData = JSON.parse(fs.readFileSync(collectionsDataPath, 'utf8'));
        
        // 生成静态HTML
        const collectionsHtml = generateCollectionsHTML(collectionsData);
        
        const collectionsPath = path.join(targetDir, 'collections.html');
        fs.writeFileSync(collectionsPath, collectionsHtml);
        console.log('✓ collections.html 已生成（包含完整内容）');
    } catch (error) {
        console.error('生成collections.html失败:', error);
        // 生成简单的重定向页面作为备用
        const fallbackHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>资源集合</title>
    <meta http-equiv="refresh" content="0; url=/">
</head>
<body>
    <p>正在跳转到资源集合页面...</p>
    <script>window.location.href = '/';<\/script>
</body>
</html>`;
        const collectionsPath = path.join(targetDir, 'collections.html');
        fs.writeFileSync(collectionsPath, fallbackHtml);
        console.log('✓ collections.html 已生成（备用重定向版本）');
    }
}

function generateCollectionsHTML(collectionsData) {
    const { categories, collections } = collectionsData;
    
    // 默认按更新日期降序排序
    collections.sort((a, b) => new Date(b.updated) - new Date(a.updated));

    // 生成集合卡片HTML
    const collectionsHTML = collections.map(collection => {
        const category = categories.find(cat => cat.id === collection.category);
        // 检查封面是否为外部URL
        const isExternalUrl = collection.cover && (collection.cover.startsWith('http://') || collection.cover.startsWith('https://'));
        const coverImage = collection.cover ?
            (isExternalUrl ? collection.cover : `/collections-static/images/${path.basename(collection.cover)}`) :
            '';
        
        return `
            <div class="ios-card collection-card p-6" data-id="${collection.id}" data-category="${collection.category}" data-tags="${collection.tags.join(',').toLowerCase()}" data-views="${collection.views || 0}" data-updated="${collection.updated}" data-created="${collection.created}">
                <!-- 集合封面 -->
                <div class="mb-4">
                    ${coverImage ? `
                        <div class="collection-cover overflow-hidden">
                            <img
                                src="${coverImage}"
                                alt="${collection.title}"
                                class="w-full h-full object-cover"
                                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                            />
                            <div class="collection-cover flex items-center justify-center text-white text-4xl" style="display: none;">
                                <i class="fas ${category?.icon || 'fa-folder'}"></i>
                            </div>
                        </div>
                    ` : `
                        <div class="collection-cover flex items-center justify-center text-white text-4xl">
                            <i class="fas ${category?.icon || 'fa-folder'}"></i>
                        </div>
                    `}
                </div>
                
                <!-- 集合信息 -->
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xl font-semibold text-gray-800 line-clamp-2">${collection.title}</h3>
                        <span class="platform-icon ${category?.color || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded-full">
                            <i class="fas ${category?.icon || 'fa-folder'}"></i>
                        </span>
                    </div>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${collection.description}</p>
                    
                    <!-- 标签 -->
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${collection.tags.slice(0, 3).map(tag => `<span class="platform-tag text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${tag}</span>`).join('')}
                        ${collection.tags.length > 3 ? `<span class="platform-tag text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">+${collection.tags.length - 3}</span>` : ''}
                    </div>
                    
                    <!-- 统计信息 -->
                    <div class="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            <i class="fas fa-file-alt mr-1"></i>
                            ${collection.resourceCount} 个资源
                        </span>
                        <span>
                            <i class="fas fa-eye mr-1"></i>
                            <span class="view-count">${collection.views || 0}</span> 次访问
                        </span>
                        <span>
                            <i class="fas fa-clock mr-1"></i>
                            ${new Date(collection.updated).toLocaleDateString('zh-CN')}
                        </span>
                    </div>
                </div>
                
                <!-- 操作按钮 -->
                <div class="flex gap-2">
                    <a href="/collections-static/${collection.id}.html" class="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl py-2 px-4 font-medium hover:opacity-90 transition-opacity text-center">
                        查看详情
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    // 生成分类标签HTML
    const categoryTabsHTML = categories.map(category => `
        <button class="category-tab" data-category="${category.id}">
            <i class="fas ${category.icon} mr-2"></i>
            ${category.name}
        </button>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>资源集合 - 盘搜</title>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DQW3NHY60Z"><\/script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-DQW3NHY60Z');
    <\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .collection-cover {
            width: 100%;
            height: 200px;
            border-radius: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .category-tab { padding: 8px 16px; border-radius: 20px; border: 1px solid #e5e7eb; background: white; color: #6b7280; transition: all 0.2s; cursor: pointer; }
        .category-tab.active, .category-tab:hover { background: #3b82f6; color: white; border-color: #3b82f6; }
        .ios-card { background: white; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; }
        .ios-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .platform-icon.bg-orange-500 { background-color: #f97316; }
        .platform-icon.bg-green-500 { background-color: #22c55e; }
        .platform-icon.bg-blue-500 { background-color: #3b82f6; }
        .platform-icon.bg-yellow-500 { background-color: #eab308; }
        .platform-icon.bg-purple-500 { background-color: #a855f7; }
        .platform-icon.bg-red-500 { background-color: #ef4444; }
        .platform-icon.bg-pink-500 { background-color: #ec4899; }
        .platform-icon.bg-indigo-500 { background-color: #6366f1; }
        .platform-icon.bg-gray-500 { background-color: #6b7280; }
        .platform-icon.bg-blue-600 { background-color: #2563eb; }
        #sortOrder {
           -webkit-appearance: none;
           -moz-appearance: none;
           appearance: none;
           background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
           background-repeat: no-repeat;
           background-position: right 0.75rem center;
           background-size: 1em;
           padding-right: 2.5rem;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-6xl mx-auto p-4">
        <!-- 标题区域 -->
        <div class="text-center mb-10 fade-in">
            <div class="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <img src="/collections-static/logo.png" alt="盘搜 Logo" class="w-full h-full object-contain">
            </div>
            <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">资源集合</h1>
            <p class="text-gray-600 text-lg">精心整理的优质资源合集,陆续更新中...</p>
            <div class="mt-4">
                <a href="/" class="text-blue-600 hover:underline text-sm">← 返回搜索页面</a>
            </div>
        </div>

        <!-- 分类导航 -->
        <div class="mb-8">
            <div class="flex flex-wrap gap-3 justify-center">
                <button class="category-tab active" data-category="all">
                    <i class="fas fa-th-large mr-2"></i>全部
                </button>
                ${categoryTabsHTML}
            </div>
        </div>

        <!-- 筛选和排序 -->
       <div class="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
           <!-- 搜索框 -->
           <div class="ios-card p-1 search-box flex-grow w-full md:w-auto">
               <div class="flex items-center">
                   <div class="pl-4 text-gray-400">
                       <i class="fas fa-search"></i>
                   </div>
                   <input 
                       type="text" 
                       id="collectionSearch" 
                       placeholder="搜索集合名称或标签..." 
                       class="w-full py-4 px-4 bg-transparent outline-none text-lg placeholder-gray-400"
                       autocomplete="off"
                   >
               </div>
           </div>
           <!-- 排序方式 -->
           <div class="ios-card p-1">
               <select id="sortOrder" class="w-full md:w-auto py-4 px-4 bg-transparent outline-none text-lg text-gray-500">
                   <option value="updated">按更新时间</option>
                   <option value="views">按访问次数</option>
                   <option value="created">按创建日期</option>
               </select>
           </div>
       </div>

        <!-- 集合展示区域 -->
        <div id="collectionsContainer" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${collectionsHTML}
        </div>

        <!-- 页脚 -->
        <div class="mt-12 text-center text-gray-600">
            <p class="text-sm">
                <a href="/" class="text-blue-600 hover:underline">返回搜索页面</a>
            </p>
        </div>
    </div>

    <script>
        window.addEventListener('pageshow', () => {
            fetchAllViews();
        });

        document.addEventListener('DOMContentLoaded', () => {
            const categoryTabs = document.querySelectorAll('.category-tab');
            const searchInput = document.getElementById('collectionSearch');
            const sortOrderSelect = document.getElementById('sortOrder');
            const collectionsContainer = document.getElementById('collectionsContainer');
            
            let allCollectionCards = Array.from(document.querySelectorAll('.collection-card'));

            function renderCollections(cards) {
                collectionsContainer.innerHTML = '';
                cards.forEach(card => {
                    collectionsContainer.appendChild(card);
                });
            }

            function sortCollections(cards, sortBy) {
                return [...cards].sort((a, b) => {
                    const aValue = a.dataset[sortBy];
                    const bValue = b.dataset[sortBy];

                    if (sortBy === 'views') {
                        return parseInt(bValue, 10) - parseInt(aValue, 10);
                    }
                    return new Date(bValue) - new Date(aValue);
                });
            }

            function filterAndSort() {
                const activeCategory = document.querySelector('.category-tab.active').dataset.category;
                const searchTerm = searchInput.value.toLowerCase();
                const sortBy = sortOrderSelect.value;

                let filteredCards = allCollectionCards.filter(card => {
                    const cardCategory = card.dataset.category;
                    const cardTags = card.dataset.tags;
                    const cardTitle = card.querySelector('h3').textContent.toLowerCase();
                    
                    const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;
                    const matchesSearch = !searchTerm || cardTitle.includes(searchTerm) || cardTags.includes(searchTerm);
                    
                    return matchesCategory && matchesSearch;
                });

                const sortedCards = sortCollections(filteredCards, sortBy);
                renderCollections(sortedCards);
            }

            categoryTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    categoryTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    filterAndSort();
                });
            });

            searchInput.addEventListener('input', filterAndSort);
            sortOrderSelect.addEventListener('change', filterAndSort);

            filterAndSort(); // Initial sort and render

            async function fetchAllViews() {
                try {
                    const response = await fetch('/api/get-all-views');
                    if (!response.ok) return;
                    const views = await response.json();
                    
                    document.querySelectorAll('.collection-card').forEach(card => {
                        const collectionId = card.dataset.id;
                        if (views[collectionId] !== undefined) {
                            const viewCountSpan = card.querySelector('.view-count');
                            if (viewCountSpan) {
                                viewCountSpan.textContent = views[collectionId];
                            }
                            card.dataset.views = views[collectionId];
                        }
                    });
                    filterAndSort();
                } catch (error) {
                    console.error('Failed to fetch all views:', error);
                }
            }

            fetchAllViews();
        });
    <\/script>
</body>
</html>`;
}

function generateStaticCollectionHtml(collection, categories, platformMap) {
    const category = categories.find(cat => cat.id === collection.category);
    const coverImage = collection.cover ? 
        `/collections-static/images/${path.basename(collection.cover)}` : 
        '';

    const resourcesHtml = collection.resources.map(resource => {
        const platform = platformMap[resource.platform] || platformMap.others;
        return `
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div class="flex items-start gap-4">
                    <div class="w-10 h-10 ${platform.color.replace('bg-', 'bg-')} text-white rounded-lg flex items-center justify-center">
                        <i class="fas ${platform.icon}"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 mb-1">${resource.name}</h4>
                        <p class="text-sm text-gray-600 mb-2">${resource.description || ''}</p>
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${platform.name}</span>
                            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">${resource.size}</span>
                            ${resource.tags.map(tag => `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">${tag}</span>`).join('')}
                        </div>
                        <div class="flex gap-2">
                            <button class="text-blue-600 hover:underline text-sm copy-link-btn" data-link="${resource.link}">
                                <i class="fas fa-copy mr-1"></i>复制链接
                            </button>
                            <a href="${resource.link}" target="_blank" rel="noreferrer" class="text-blue-600 hover:underline text-sm">
                                <i class="fas fa-external-link-alt mr-1"></i>立即查看
                            </a>
                            ${resource.password ? `
                                <button class="text-blue-600 hover:underline text-sm copy-password-btn" data-password="${resource.password}">
                                    <i class="fas fa-key mr-1"></i>复制密码
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 提取所有资源名称作为额外的keywords
    const resourceNames = collection.resources.map(resource => resource.name);
    // 合并集合标签和资源名称，去除重复项
    const allKeywords = [...new Set([...collection.tags, ...resourceNames])].join(', ');
    
    // 创建更详细的description，包含资源数量和部分资源名称
    const resourceCount = collection.resources.length;
    const sampleResources = collection.resources.slice(0, 3).map(resource => resource.name);
    const detailedDescription = `${collection.description} 包含${resourceCount}个资源，如：${sampleResources.join(', ')}等。`;

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${collection.title} - 盘搜</title>
    <meta name="description" content="${detailedDescription}">
    <meta name="keywords" content="${allKeywords}">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DQW3NHY60Z"><\/script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-DQW3NHY60Z');
    <\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .fade-in { animation: fadeIn 0.5s ease-in; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto p-4">
        <div class="bg-white rounded-2xl shadow-lg p-8">
            <!-- 返回按钮 -->
            <div class="mb-6">
                <a href="/collections-static/collections.html" class="text-blue-600 hover:underline">
                    <i class="fas fa-arrow-left mr-2"></i>返回集合列表
                </a>
            </div>

            <!-- 集合头部 -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800">${collection.title}</h1>
                <p class="text-gray-600 mt-2">${collection.description}</p>
                <div class="mt-4 flex justify-center items-center gap-4 text-sm text-gray-500">
                    <span><i class="fas fa-clock mr-1"></i>更新于 ${new Date(collection.updated).toLocaleDateString('zh-CN')}</span>
                    <span><i class="fas fa-eye mr-1"></i><span id="view-count">-</span> 次访问</span>
                </div>
            </div>

            <!-- 资源列表 -->
            <div class="space-y-4">
                ${resourcesHtml}
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // 复制功能
            document.querySelectorAll('.copy-link-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.dataset.link);
                    btn.innerHTML = '<i class="fas fa-check mr-1"></i>已复制';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-copy mr-1"></i>复制链接';
                    }, 2000);
                });
            });

            document.querySelectorAll('.copy-password-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    navigator.clipboard.writeText(btn.dataset.password);
                    btn.innerHTML = '<i class="fas fa-check mr-1"></i>已复制';
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-key mr-1"></i>复制密码';
                    }, 2000);
                });
            });

            // 增加访问次数
            fetch('/api/increment-views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ collectionId: '${collection.id}' }),
            })
            .then(response => response.json())
            .then(data => {
                if (data && data.views !== undefined) {
                    // 成功增加计数，直接更新显示
                    const viewCountSpan = document.getElementById('view-count');
                    if (viewCountSpan) {
                        viewCountSpan.textContent = data.views;
                    }
                } else {
                    // 被速率限制阻止，需要主动获取当前计数
                    return fetch('/api/get-all-views')
                        .then(response => response.json())
                        .then(allViews => {
                            const currentViews = allViews['${collection.id}'] || 0;
                            const viewCountSpan = document.getElementById('view-count');
                            if (viewCountSpan) {
                                viewCountSpan.textContent = currentViews;
                            }
                        });
                }
            })
            .catch(error => console.error('Error incrementing/viewing view count:', error));
        });
    <\/script>
</body>
</html>`;

    const targetPath = path.join(targetDir, `${collection.id}.html`);
    fs.writeFileSync(targetPath, htmlContent);
    console.log(`✓ ${collection.id}.html 已生成`);
}

function generateStaticGoHtml() {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>正在跳转...</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }
        .container { text-align: center; }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="loader"></div>
        <p>正在安全跳转，请稍候...</p>
    </div>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const targetUrl = urlParams.get('url');
        if (targetUrl) {
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 500);
        }
    <\/script>
</body>
</html>`;
    const targetPath = path.join(targetDir, 'go.html');
    fs.writeFileSync(targetPath, htmlContent);
    console.log(`✓ go.html 已生成`);
}

console.log('🎉 构建完成！');