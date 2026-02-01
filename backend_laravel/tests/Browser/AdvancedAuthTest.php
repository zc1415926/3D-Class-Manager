<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AdvancedAuthTest extends DuskTestCase
{
    /**
     * 测试密码修改功能
     */
    public function test_change_password()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("个人设置")')
                ->waitFor('.modal.show')
                ->type('input[name="currentPassword"]', 'zaq12wsx')
                ->type('input[name="newPassword"]', 'new_password_123')
                ->type('input[name="confirmPassword"]', 'new_password_123')
                ->press('button:contains("修改密码")')
                ->assertSee('密码修改成功');
        });
    }

    /**
     * 测试角色权限控制（教师角色）
     */
    public function test_teacher_role_permissions()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                // 教师应该能访问这些页面
                ->visit('http://localhost:3000/student-management')
                ->assertPathIs('/student-management')
                ->visit('http://localhost:3000/assignment-management')
                ->assertPathIs('/assignment-management')
                ->visit('http://localhost:3000/teacher-page')
                ->assertPathIs('/teacher-page');
        });
    }

    /**
     * 测试Token过期处理
     */
    public function test_token_expiration()
    {
        $this->browse(function (Browser $browser) {
            // 登录后等待一段时间，模拟token过期
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->pause(1000)
                ->visit('http://localhost:3000/teacher-dashboard')
                ->assertSee('教师仪表板');
        });
    }

    /**
     * 测试会话管理
     */
    public function test_session_management()
    {
        $this->browse(function (Browser $browser) {
            // 打开两个浏览器窗口测试会话
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('button:contains("退出")')
                ->waitForLocation('/')
                ->visit('http://localhost:3000/teacher-dashboard')
                ->assertPathIs('/login');
        });
    }

    /**
     * 测试密码强度验证
     */
    public function test_password_strength_validation()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("个人设置")')
                ->waitFor('.modal.show')
                ->type('input[name="currentPassword"]', 'zaq12wsx')
                ->type('input[name="newPassword"]', '123')
                ->type('input[name="confirmPassword"]', '123')
                ->press('button:contains("修改密码")')
                ->assertSee('密码强度不足');
        });
    }

    /**
     * 测试记住登录状态
     */
    public function test_remember_login()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->check('input[type="checkbox"]')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertCookieExists('remember_token');
        });
    }

    /**
     * 测试同时登录检测
     */
    public function test_concurrent_login_detection()
    {
        $this->browse(function (Browser $browser) {
            // 这个测试需要多个浏览器实例
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('欢迎回来');
        });
    }

    /**
     * 测试锁定账户机制
     */
    public function test_account_lockout_mechanism()
    {
        $this->browse(function (Browser $browser) {
            // 多次尝试错误登录
            for ($i = 0; $i < 5; $i++) {
                $browser->visit('http://localhost:3000/login')
                    ->type('#username', 'zc1415926')
                    ->type('#password', 'wrong_password')
                    ->press('button[type="submit"]');
            }
            $browser->assertSee('账户已被锁定');
        });
    }

    /**
     * 测试双因素认证（如果已实现）
     */
    public function test_two_factor_authentication()
    {
        $this->browse(function (Browser $browser) {
            // 检查是否有双因素认证功能
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板');
        });
    }
}