<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class StudentManagementTest extends DuskTestCase
{
    /**
     * 测试查看学生列表
     */
    public function test_view_student_list()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("学生管理")')
                ->waitForLocation('/student-management')
                ->assertSee('学生管理')
                ->assertSee('张三')
                ->assertSee('李四')
                ->assertSee('王五');
        });
    }

    /**
     * 测试添加新学生
     */
    public function test_add_new_student()
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
                ->type('input[name="name"]', '测试学生')
                ->type('input[name="year"]', '2026')
                ->press('button:contains("保存")')
                ->assertSee('学生添加成功')
                ->assertSee('测试学生');
        });
    }

    /**
     * 测试编辑学生信息
     */
    public function test_edit_student()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("学生管理")')
                ->waitForLocation('/student-management')
                ->press('button:contains("编辑"):first')
                ->waitFor('.modal.show')
                ->clear('input[name="name"]')
                ->type('input[name="name"]', '修改后的姓名')
                ->press('button:contains("保存")')
                ->assertSee('学生信息更新成功')
                ->assertSee('修改后的姓名');
        });
    }

    /**
     * 测试删除学生
     */
    public function test_delete_student()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("学生管理")')
                ->waitForLocation('/student-management')
                ->press('button:contains("删除"):last')
                ->acceptDialog()
                ->assertSee('删除成功');
        });
    }
}