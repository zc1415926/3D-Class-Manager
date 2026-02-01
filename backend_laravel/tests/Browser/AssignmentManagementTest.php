<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class AssignmentManagementTest extends DuskTestCase
{
    /**
     * 测试查看作业列表
     */
    public function test_view_assignment_list()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->assertSee('作业管理')
                ->assertSee('3D建模入门')
                ->assertSee('3D建模进阶');
        });
    }

    /**
     * 测试创建新作业
     */
    public function test_create_new_assignment()
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
                ->type('input[name="name"]', '测试作业')
                ->type('input[name="year"]', '2026')
                ->press('button:contains("保存")')
                ->assertSee('作业创建成功')
                ->assertSee('测试作业');
        });
    }

    /**
     * 测试查看作业详情
     */
    public function test_view_assignment_details()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->click('a:contains("查看"):first')
                ->assertSee('作业详情')
                ->assertSee('上传要求')
                ->assertSee('提交的作品');
        });
    }

    /**
     * 测试删除作业
     */
    public function test_delete_assignment()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作业管理")')
                ->waitForLocation('/assignment-management')
                ->press('button:contains("删除"):last')
                ->acceptDialog()
                ->assertSee('作业已删除');
        });
    }
}