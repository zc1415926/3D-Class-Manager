<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class SubmissionTest extends DuskTestCase
{
    /**
     * 测试查看作品列表
     */
    public function test_view_submission_list()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作品管理")')
                ->waitForLocation('/teacher-page')
                ->assertSee('作品管理')
                ->assertSee('彩色立方体')
                ->assertSee('球形建筑');
        });
    }

    /**
     * 测试查看作品详情
     */
    public function test_view_submission_details()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作品管理")')
                ->waitForLocation('/teacher-page')
                ->click('a:contains("查看"):first')
                ->assertSee('作品详情')
                ->assertSee('学生姓名')
                ->assertSee('作品名称')
                ->assertSee('作品描述')
                ->assertSee('文件列表');
        });
    }

    /**
     * 测试作品评分
     */
    public function test_grade_submission()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/login')
                ->type('#username', 'zc1415926')
                ->type('#password', 'zaq12wsx')
                ->press('button[type="submit"]')
                ->waitForLocation('/teacher-dashboard')
                ->click('a:contains("作品管理")')
                ->waitForLocation('/teacher-page')
                ->click('button:contains("评分"):first')
                ->waitFor('.modal.show')
                ->select('select[name="grade"]', 'A')
                ->press('button:contains("保存评分")')
                ->assertSee('评分成功');
        });
    }

    /**
     * 测试学生提交作品
     */
    public function test_student_submit_work()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('http://localhost:3000/')
                ->click('a:contains("学生提交")')
                ->waitForLocation('/submission')
                ->select('select[name="studentName"]', '张三')
                ->select('select[name="assignmentId"]', '1')
                ->type('input[name="workName"]', '测试作品')
                ->press('button[type="submit"]')
                ->assertSee('作品提交成功');
        });
    }
}