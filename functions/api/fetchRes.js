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

    const response = await fetch(url);
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
        return new Response(response.body, {
            headers: headers
        })
    } else {
        console.log('[fetchRes] 验证失败');
        return new Response('URL is not an image or video', { status: 400 })
    }
}