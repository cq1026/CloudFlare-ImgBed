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
    console.log('[fetchRes] 收到 URL:', url);

    if (url === undefined) {
        return new Response('URL is required', { status: 400 })
    }

    // 添加必要的请求头，模拟浏览器请求
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site'
        }
    });

    console.log('[fetchRes] Response status:', response.status);

    // 检查响应状态码
    if (!response.ok) {
        console.log('[fetchRes] 请求失败，状态码:', response.status);
        return new Response(`Failed to fetch URL: HTTP ${response.status}`, { status: 400 })
    }

    const contentType = response.headers.get('content-type');
    console.log('[fetchRes] Content-Type:', contentType);

    // 检查 content-type（如果存在）
    const hasValidContentType = contentType && (contentType.startsWith('image') || contentType.startsWith('video'));
    console.log('[fetchRes] hasValidContentType:', hasValidContentType);

    // 后备方案：检查 URL 文件扩展名（用于 content-type 缺失或不正确的情况）
    const urlPath = new URL(url).pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.avif', '.heic', '.heif'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
    const hasValidExtension = [...imageExtensions, ...videoExtensions].some(ext => urlPath.endsWith(ext));
    console.log('[fetchRes] URL pathname:', urlPath);
    console.log('[fetchRes] hasValidExtension:', hasValidExtension);

    if (hasValidContentType || hasValidExtension) {
        console.log('[fetchRes] 验证通过，返回内容');
        //增加跨域头后返回
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', '*');

        // 如果原始 Content-Type 无效，根据文件扩展名设置正确的 Content-Type
        if (!hasValidContentType && hasValidExtension) {
            // 根据文件扩展名映射到 MIME 类型
            const ext = urlPath.substring(urlPath.lastIndexOf('.'));
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
                '.tiff': 'image/tiff',
                '.avif': 'image/avif',
                '.heic': 'image/heic',
                '.heif': 'image/heif',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogg': 'video/ogg',
                '.mov': 'video/quicktime',
                '.avi': 'video/x-msvideo',
                '.mkv': 'video/x-matroska',
                '.flv': 'video/x-flv',
                '.wmv': 'video/x-ms-wmv',
                '.m4v': 'video/x-m4v',
                '.3gp': 'video/3gpp'
            };
            const correctMimeType = mimeTypes[ext] || 'application/octet-stream';
            headers.set('Content-Type', correctMimeType);
            console.log('[fetchRes] 修正 Content-Type 为:', correctMimeType);
        }

        return new Response(response.body, {
            headers: headers
        })
    } else {
        console.log('[fetchRes] 验证失败');
        return new Response('URL is not an image or video', { status: 400 })
    }
}