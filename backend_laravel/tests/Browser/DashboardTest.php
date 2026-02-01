<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class DashboardTest extends DuskTestCase
{
    /**
     * 测试教师仪表板显示
     */
    public function test_teacher_dashboard_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('教师仪表板')
                ->assertSee('欢迎回来')
                ->assertPresent('.dashboard-stats');
        });
    }

    /**
     * 测试统计数据准确性
     */
    public function test_dashboard_statistics_accuracy()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('学生总数')
                ->assertSee('作业总数')
                ->assertSee('作品总数')
                ->assertSee('待评分作品');
        });
    }

    /**
     * 测试快捷操作功能
     */
    public function test_quick_actions()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("新建作业")')
                ->assertPathIs('/assignment-new')
                ->visit('http://localhost:3000/teacher-dashboard')
                ->click('a:contains("查看作品")')
                ->assertPathIs('/teacher-page');
        });
    }

    /**
     * 测试最近活动展示
     */
    public function test_recent_activity_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertSee('最近活动')
                ->assertPresent('.activity-list');
        });
    }

    /**
     * 测试图表显示
     */
    public function test_charts_display()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->assertPresent('.chart-container');
        });
    }
}