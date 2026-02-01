<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AuthTest extends DuskTestCase
{
    /**
     * 测试登录成功
     */
    public function test_successful_login()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('input[type="text"]', 'zc1415926')
                ->type('input[type="password"]', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->pause(2000)
                ->assertPathIs('/dashboard')
                ->assertSee('仪表板');
        });
    }

    /**
     * 测试登录失败 - 错误密码
     */
    public function test_login_with_wrong_password()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('input[type="text"]', 'zc1415926')
                ->type('input[type="password"]', 'wrongpassword')
                ->press('button[type="submit"]')
                ->assertPathIs('/login')
                ->assertSee('用户名或密码错误');
        });
    }

    /**
     * 测试登出功能
     */
    public function test_logout()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('input[type="text"]', 'zc1415926')
                ->type('input[type="password"]', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('button:contains("退出")')
                ->waitForLocation('/')
                ->assertPathIs('/')
                ->assertSee('3D班级管理系统');
        });
    }

    /**
     * 测试未登录访问受保护页面
     */
    public function test_protected_pages_without_login()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/teacher-dashboard')
                ->assertPathIs('/login')
                ->assertSee('请先登录');
        });
    }
}