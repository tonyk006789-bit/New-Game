export function entryFromHtml(html:string){return /<script\b[^>]*\bsrc=["'](\/assets\/index-[^"']+\.js)["']/i.exec(html)?.[1]||null;}
export function isNewRelease(current:string|null,html:string){const next=entryFromHtml(html);return !!current&&!!next&&current!==next;}
