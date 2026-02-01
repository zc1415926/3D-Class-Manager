<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class ErrorHandlingTest extends DuskTestCase
{
    /**
     * 测试表单验证错误
     */
    public function test_form_validation_errors()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->press('button[type="submit"]')
                ->assertSee('请输入用户名')
                ->assertSee('请输入密码');
        });
    }

    /**
     * 测试登录失败错误
     */
    public function test_login_failure_error()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'nonexistent_user')
                ->type('#password', 'wrong_password')
                ->press('button[type="submit"]')
                ->assertSee('登录失败');
        });
    }

    /**
     * 测试404错误页面
     */
    public function test_404_error_page()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/nonexistent-page')
                ->assertSee('页面不存在')
                ->assertSee('404');
        });
    }

    /**
     * 测试403权限拒绝页面
     */
    public function test_403_access_denied_page()
    {
        $this->browse(function (Browser $browser) {
            // 尝试访问需要管理员权限的页面
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->visit('http://localhost:3000/admin/settings')
                ->assertSee('访问被拒绝')
                ->assertSee('403');
        });
    }

    /**
     * 测试网络错误处理
     */
    public function test_network_error_handling()
    {
        $this->browse(function (Browser $browser) {
            // 模拟网络错误
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('网络连接正常');
        });
    }

    /**
     * 测试空数据状态
     */
    public function test_empty_data_state()
    {
        $this->browse(function (Browser $browser) {
            // 访问一个可能为空的数据页面
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('暂无数据');
        });
    }

    /**
     * 测试长文本输入
     */
    public function test_long_text_input()
    {
        $this->browse(function (Browser $browser) {
            $longText = str_repeat('测试文本', 1000);

            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("新建作业")')
                ->waitForLocation('/assignment-new')
                ->type('textarea[name="description"]', $longText)
                ->press('button:contains("保存")')
                ->assertSee('描述长度超出限制');
        });
    }

    /**
     * 测试特殊字符输入
     */
    public function test_special_characters_input()
    {
        $this->browse(function (Browser $browser) {
            $specialChars = '<script>alert("test")</script>"\'&<>';

            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("新建作业")')
                ->waitForLocation('/assignment-new')
                ->type('input[name="name"]', $specialChars)
                ->press('button:contains("保存")')
                ->assertSee('包含非法字符');
        });
    }

    /**
     * 测试超时处理
     */
    public function test_timeout_handling()
    {
        $this->browse(function (Browser $browser) {
            // 模拟超时场景
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard', 30)
                ->assertSee('教师仪表板');
        });
    }

    /**
     * 测试错误恢复机制
     */
    public function test_error_recovery_mechanism()
    {
        $this->browse(function (Browser $browser) {
            // 模拟错误后恢复
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'wrong_user')
                ->type('#password', 'wrong_password')
                ->press('button[type="submit"]')
                ->assertSee('登录失败')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板');
        });
    }
}
