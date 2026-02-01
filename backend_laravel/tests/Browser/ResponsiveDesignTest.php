<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use Facebook\WebDriver\Chrome\ChromeOptions;

class ResponsiveDesignTest extends DuskTestCase
{
    /**
     * 测试桌面端显示 (1920x1080)
     */
    public function test_desktop_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->resize(1920, 1080)
                ->assertVisible('#username')
                ->assertVisible('#password')
                ->assertVisible('button[type="submit"]')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板')
                ->assertPresent('.navbar')
                ->assertPresent('.sidebar');
        });
    }

    /**
     * 测试平板端显示 (768x1024)
     */
    public function test_tablet_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->resize(768, 1024)
                ->assertVisible('#username')
                ->assertVisible('#password')
                ->assertVisible('button[type="submit"]')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板')
                ->assertPresent('.navbar')
                ->assertPresent('.sidebar');
        });
    }

    /**
     * 测试移动端显示 (375x667)
     */
    public function test_mobile_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->resize(375, 667)
                ->assertVisible('#username')
                ->assertVisible('#password')
                ->assertVisible('button[type="submit"]')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板')
                ->assertPresent('.navbar')
                ->assertPresent('.sidebar');
        });
    }

    /**
     * 测试导航栏响应式
     */
    public function test_responsive_navigation()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                // 桌面端
                ->resize(1920, 1080)
                ->assertVisible('.nav-links')
                // 移动端
                ->resize(375, 667)
                ->assertVisible('.mobile-menu-toggle')
                ->click('.mobile-menu-toggle')
                ->assertVisible('.mobile-menu');
        });
    }

    /**
     * 测试表格响应式
     */
    public function test_responsive_tables()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("学生管理")')
                ->waitForLocation('/student-management')
                // 桌面端
                ->resize(1920, 1080)
                ->assertPresent('.table-responsive')
                // 移动端
                ->resize(375, 667)
                ->assertPresent('.table-scrollable');
        });
    }

    /**
     * 测试模态框响应式
     */
    public function test_responsive_modals()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("学生管理")')
                ->waitForLocation('/student-management')
                ->click('button:contains("添加学生")')
                ->waitFor('.modal.show')
                ->assertPresent('.modal-dialog')
                ->assertPresent('.modal-content');
        });
    }

    /**
     * 测试表单响应式
     */
    public function test_responsive_forms()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("新建作业")')
                ->waitForLocation('/assignment-new')
                ->assertVisible('input[name="name"]')
                ->assertVisible('input[name="year"]')
                ->assertVisible('button[type="submit"]');
        });
    }
}