if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
} else {
    window.weavecore = window.weavecore || {};
}

(function () {

    function URLUtil() {

    }

    URLUtil.isHttpURL = function (url) {
        return url !== null &&
            (url.indexOf("http://") === 0 ||
                url.indexOf("https://") === 0);

    }

    URLUtil.getFullURL = function (rootURL, url) {
        if (url !== null && !URLUtil.isHttpURL(url)) {
            if (url.indexOf("./") === 0) {
                url = url.substring(2);
            }
            if (URLUtil.isHttpURL(rootURL)) {
                var slashPos;

                if (url.charAt(0) === '/') {
                    // non-relative path, "/dev/foo.bar".
                    slashPos = rootURL.indexOf("/", 8);
                    if (slashPos === -1)
                        slashPos = rootURL.length;
                } else {
                    // relative path, "dev/foo.bar".
                    slashPos = rootURL.lastIndexOf("/") + 1;
                    if (slashPos <= 8) {
                        rootURL += "/";
                        slashPos = rootURL.length;
                    }
                }

                if (slashPos > 0)
                    url = rootURL.substring(0, slashPos) + url;
            }
        }

        return url;
    }

    weavecore.URLUtil = URLUtil;

}());
