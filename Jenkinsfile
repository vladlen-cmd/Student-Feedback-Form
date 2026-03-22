pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        PROJECT_DIR   = "${WORKSPACE}"
        PYTHON        = 'python3'
        REPORT_DIR    = 'reports'
        CHROMEDRIVER  = "${WORKSPACE}/chromedriver"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '── Checking out source code ──'
                checkout scm
            }
        }

        stage('Setup Environment') {
            steps {
                echo '── Installing Python dependencies ──'
                sh """
                    ${PYTHON} -m pip install --upgrade pip --quiet
                    ${PYTHON} -m pip install selenium webdriver-manager pytest pytest-html --quiet
                """
            }
        }

        stage('Verify ChromeDriver') {
            steps {
                echo '── Checking ChromeDriver & Chrome versions ──'
                sh """
                    # Make local chromedriver executable if present
                    if [ -f "${CHROMEDRIVER}" ]; then
                        chmod +x "${CHROMEDRIVER}"
                        echo "Local chromedriver: \$(${CHROMEDRIVER} --version)"
                    else
                        echo "No local chromedriver found — webdriver_manager will download one."
                    fi

                    # Print installed Chrome version (common paths)
                    CHROME_BIN=\$(which google-chrome || which chromium || \
                        echo '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
                    "\${CHROME_BIN}" --version 2>/dev/null || echo "Chrome binary not found at default path"
                """
            }
        }

        stage('Run Selenium Tests') {
            steps {
                echo '── Running Selenium test suite ──'
                sh """
                    mkdir -p ${REPORT_DIR}
                    cd "${PROJECT_DIR}"
                    ${PYTHON} -m pytest test_form.py -v \
                        --html=${REPORT_DIR}/test_report.html \
                        --self-contained-html \
                        --tb=short \
                        -p no:cacheprovider
                """
            }
        }
    }

    post {
        always {
            echo '── Publishing test report ──'
            publishHTML(target: [
                allowMissing:         false,
                alwaysLinkToLastBuild: true,
                keepAll:              true,
                reportDir:            'reports',
                reportFiles:          'test_report.html',
                reportName:           'Selenium Test Report'
            ])
        }

        success {
            echo "✅ All tests passed on branch: ${env.BRANCH_NAME ?: 'local'}"
        }

        failure {
            echo "❌ Tests failed — check the Selenium Test Report above."
            // Uncomment to email on failure:
            // mail to: 'dev@symbiosis.ac.in',
            //      subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            //      body: "See console output at ${env.BUILD_URL}"
        }

        cleanup {
            echo '── Cleaning workspace ──'
            cleanWs()
        }
    }
}
