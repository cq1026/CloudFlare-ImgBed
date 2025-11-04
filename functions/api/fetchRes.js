export async function onRequest(context) {
    // 获取请求体中URL的内容，判断是否为图片或视频，如果是则返回，否则返回错误信息
    const {
        request,
        env,
        params,
        waitUntil,
        next,
        data
    } = context;
    //如果是OPTIONS请求，返回允许的方法
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        })
    }
    const jsonRequest = await request.json();
    const url = jsonRequest.url;
    if (url === undefined) {
        return new Response('URL is required', { status: 400 })
    }

    // 需要 User-Agent 的域名白名单（这些网站对 User-Agent 有严格要求）
    const needUserAgentDomains = [
        'files.catbox.moe',
        'catbox.moe',
        'i.imgur.com',
        'imgur.com'
        // 可以根据需要添加更多域名
    ];

    // 检查 URL 的域名是否在白名单中
    const urlObj = new URL(url);
    const needsUserAgent = needUserAgentDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    // 根据域名决定是否添加浏览器 headers
    const fetchOptions = needsUserAgent ? {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
    } : {};

    const response = await fetch(url, fetchOptions);

    // 检查响应状态码
    if (!response.ok) {
        return new Response(`Failed to fetch URL: HTTP ${response.status}`, { status: 400 })
    }

    const contentType = response.headers.get('content-type');

    // 检查 content-type（如果存在）
    const hasValidContentType = contentType && (contentType.startsWith('image') || contentType.startsWith('video'));

    // 后备方案：检查 URL 文件扩展名（用于 content-type 缺失或不正确的情况）
    const urlPath = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.avif', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
    const hasValidExtension = [...imageExtensions, ...videoExtensions].some(ext => urlPath.endsWith(ext));

    if (hasValidContentType || hasValidExtension) {
        //增加跨域头后返回
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(response.body, {
            headers: headers
        })
    } else {
        return new Response('URL is not an image or video', { status: 400 })
    }
}
