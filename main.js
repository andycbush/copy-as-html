/*
 * Copyright (c) 2013 Peter Flynn.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        Commands            = brackets.getModule("command/Commands"),
        Menus               = brackets.getModule("command/Menus"),
        Dialogs             = brackets.getModule("widgets/Dialogs"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        StringUtils         = brackets.getModule("utils/StringUtils");
    
    
    /**
     * Returns the given range of code as static HTML text with the appropriate color-coding CSS classes
     * @param {Editor} editor
     * @param {{line:number, ch:number}} start
     * @param {{line:number, ch:number}} end
     * @return {string}
     */
    function getHighlightedText(editor, start, end) {
        var pos = { line: start.line, ch: 0 };
        var it = TokenUtils.getInitialContext(editor._codeMirror, pos);
        var lastLine = start.line;
        
        var html = "<div>";
        
        while (TokenUtils.moveNextToken(it) && it.pos.line <= end.line) {
            if (it.pos.line !== lastLine) {
                lastLine = it.pos.line;
                html += "</div><div>";
            }
            if (it.token.className) {
                html += "<span class='cm-" + it.token.className + "'>" +
                        StringUtils.htmlEscape(it.token.string) + "</span>";
            } else {
                html += StringUtils.htmlEscape(it.token.string);
            }
        }
        html += "</div>";
        
        return "<span class='cm-s-default'>" + html + "</span>";
    }
    
    
    /** Opens a dialog containing the HTML-formatted text, ready for copying */
    function showDialog() {
        var editor = EditorManager.getFocusedEditor();
        var range;
        if (editor.hasSelection()) {
            range = editor.getSelection();
        } else {
            range = {start: {line: editor.getFirstVisibleLine(), ch: 0},
                     end: {line: editor.getLastVisibleLine() + 1, ch: 0}};
        }
        
        var html = getHighlightedText(editor, range.start, range.end);
        
        
        var fonts = "SourceCodePro, Consolas, \"Lucida Console\", \"Courier New\"";  // most users won't have SCP installed in the OS
        html = "Copy this text to the clipboard: " +
            "<div style='cursor: auto; -webkit-user-select: text; font-family: " + fonts + "; font-size: 12px; line-height: 15px; overflow-x: auto; word-wrap: normal; white-space: pre; max-height: 500px; max-width: 800px'>" +
            html + "</div>";
        
        Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "HTML Ready to Copy", "")
            .done(function () { EditorManager.focusEditor(); });
        
        var $dialog = $(".modal.instance");
        $(".dialog-message", $dialog).html(html);
        
        // Pre-select the text so it's easy to copy
        // (Due to browser security restrictions, we can't programmatically modify the clipboard ourelves - user still has to
        // press Ctrl+C at this point)
        window.getSelection().selectAllChildren($(".dialog-message > div", $dialog)[0]);
    }
    
    
    // Expose in UI
    var CMD_COPY_HTML = "pflynn.copy-as-html";
    CommandManager.register("Copy as Colored HTML", CMD_COPY_HTML, showDialog);
    
    var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    menu.addMenuDivider(Menus.LAST);
    menu.addMenuItem(CMD_COPY_HTML, null, Menus.AFTER, Commands.EDIT_COPY);
});