from . import user, document, menu, auth, kb_routes, onlyoffice,youtube,alibaba_auth,alibaba_debug


def register_blueprints(app):
    app.register_blueprint(user.bp, url_prefix="/api/users")
    app.register_blueprint(document.bp, url_prefix="/api/file")
    app.register_blueprint(menu.bp, url_prefix="/api/menus")   # ⭐ 新增菜单 API
    app.register_blueprint(auth.bp, url_prefix="/api/auth")   # ★ 新增
    app.register_blueprint(kb_routes.bp, url_prefix="/api/kb")   # ★ 新增
    app.register_blueprint(onlyoffice.bp, url_prefix="/api/onlyoffice")
    app.register_blueprint(youtube.bp, url_prefix="/api/youtube")
    app.register_blueprint(alibaba_auth.bp, url_prefix="/api/alibaba")
    app.register_blueprint(alibaba_debug.bp,  url_prefix="/api/alibaba_debug")
