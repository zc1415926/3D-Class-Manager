<?php

namespace Tests;

use Facebook\WebDriver\Chrome\ChromeOptions;
use Facebook\WebDriver\Remote\RemoteWebDriver;
use Laravel\Dusk\TestCase as BaseTestCase;
use Facebook\WebDriver\Remote\DesiredCapabilities;
use Facebook\WebDriver\Chrome\ChromeDevToolsDriver;
use Facebook\WebDriver\Remote\WebDriverBrowserType;

abstract class DuskTestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * 创建RemoteWebDriver实例
     */
    protected function driver(): RemoteWebDriver
    {
        $options = (new ChromeOptions)->addArguments([
            '--disable-gpu',
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
            '--lang=zh-CN',
        ]);

        return RemoteWebDriver::create(
            'http://localhost:9515/wd/hub',
            DesiredCapabilities::chrome()->setCapability(
                ChromeOptions::CAPABILITY,
                $options
            ),
            60 * 1000 * 1000 // 60秒超时
        );
    }

    /**
     * 开始浏览器会话
     */
    public static function prepare()
    {
        if (! static::$browsers) {
            static::startChromeDriver();
        }
    }
}