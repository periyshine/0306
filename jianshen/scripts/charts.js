/**
 * Charts Module - Data Visualization
 * Handles all chart rendering and updates using Chart.js
 */

// Chart instances
let weeklyChart = null;
let typeChart = null;
let weightChart = null;

// Chart.js global defaults
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
Chart.defaults.color = '#6B7280';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

/**
 * Get chart colors based on theme
 * @returns {Object} Colors object
 */
function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#D1D5DB' : '#6B7280',
        grid: isDark ? '#374151' : '#E5E7EB',
        primary: '#4F46E5',
        colors: [
            '#4F46E5',
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#14B8A6'
        ]
    };
}

/**
 * Update all charts with current data
 */
async function updateCharts() {
    await updateWeeklyChart();
    await updateTypeChart();
}

/**
 * Create or update weekly workout chart
 */
async function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    try {
        const workouts = await Storage.getAllWorkouts();

        // Get last 7 days
        const days = [];
        const counts = [];
        const durations = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayLabel = i === 0 ? '今天' : i === 1 ? '昨天' :
                date.toLocaleDateString('zh-CN', { weekday: 'short' });

            days.push(dayLabel);

            const dayWorkouts = workouts.filter(w => w.date === dateStr);
            counts.push(dayWorkouts.length);

            const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
            durations.push(totalDuration);
        }

        const colors = getChartColors();

        const config = {
            type: 'bar',
            data: {
                labels: days,
                datasets: [
                    {
                        label: '锻炼次数',
                        data: counts,
                        backgroundColor: colors.primary + '80',
                        borderColor: colors.primary,
                        borderWidth: 2,
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        label: '时长（分钟）',
                        data: durations,
                        type: 'line',
                        backgroundColor: colors.colors[1] + '40',
                        borderColor: colors.colors[1],
                        borderWidth: 3,
                        pointBackgroundColor: colors.colors[1],
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.text === '#D1D5DB' ? '#1F2937' : '#fff',
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.grid,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: colors.text
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            color: colors.text,
                            stepSize: 1
                        },
                        grid: {
                            color: colors.grid
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        ticks: {
                            color: colors.text
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        };

        if (weeklyChart) {
            weeklyChart.data = config.data;
            weeklyChart.options = config.options;
            weeklyChart.update();
        } else {
            weeklyChart = new Chart(ctx, config);
        }
    } catch (error) {
        console.error('Error updating weekly chart:', error);
    }
}

/**
 * Create or update workout type distribution chart
 */
async function updateTypeChart() {
    const ctx = document.getElementById('typeChart');
    if (!ctx) return;

    try {
        const workouts = await Storage.getAllWorkouts();

        // Count workouts by type
        const typeCounts = {};
        workouts.forEach(workout => {
            typeCounts[workout.type] = (typeCounts[workout.type] || 0) + 1;
        });

        // Get labels and data
        const labels = [];
        const data = [];
        const colors = getChartColors();

        Object.entries(typeCounts).forEach(([type, count]) => {
            const typeInfo = App?.WorkoutTypes?.[type];
            if (typeInfo) {
                labels.push(typeInfo.name);
            } else {
                labels.push(type);
            }
            data.push(count);
        });

        const chartColors = labels.map((_, i) => colors.colors[i % colors.colors.length]);

        const config = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: chartColors.map(c => c + '80'),
                    borderColor: chartColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.text === '#D1D5DB' ? '#1F2937' : '#fff',
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.grid,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(0);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        if (typeChart) {
            typeChart.data = config.data;
            typeChart.options = config.options;
            typeChart.update();
        } else {
            typeChart = new Chart(ctx, config);
        }
    } catch (error) {
        console.error('Error updating type chart:', error);
    }
}

/**
 * Create or update weight tracking chart
 */
async function updateWeightChart() {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    try {
        const weightLogs = await Storage.getAllWeightLogs();

        if (weightLogs.length < 2) {
            // Show empty state or minimal chart
            const config = {
                type: 'line',
                data: {
                    labels: weightLogs.length ? [formatDate(weightLogs[0].date)] : ['无数据'],
                    datasets: [{
                        label: '体重 (kg)',
                        data: weightLogs.length ? [weightLogs[0].weight] : [0],
                        borderColor: getChartColors().primary,
                        backgroundColor: getChartColors().primary + '20',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            backgroundColor: getChartColors().text === '#D1D5DB' ? '#1F2937' : '#fff',
                            titleColor: getChartColors().text,
                            bodyColor: getChartColors().text,
                            borderColor: getChartColors().grid,
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: getChartColors().grid
                            },
                            ticks: {
                                color: getChartColors().text
                            }
                        },
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: getChartColors().grid
                            },
                            ticks: {
                                color: getChartColors().text
                            }
                        }
                    }
                }
            };

            if (weightChart) {
                weightChart.data = config.data;
                weightChart.options = config.options;
                weightChart.update();
            } else {
                weightChart = new Chart(ctx, config);
            }
            return;
        }

        // Sort by date
        weightLogs.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate trend line
        const weights = weightLogs.map(log => log.weight);
        const n = weights.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = weights.reduce((a, b) => a + b, 0);
        const sumXY = weights.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const trendLine = weights.map((_, i) => slope * i + intercept);

        const colors = getChartColors();

        const config = {
            type: 'line',
            data: {
                labels: weightLogs.map(log => formatDate(log.date)),
                datasets: [
                    {
                        label: '体重 (kg)',
                        data: weightLogs.map(log => log.weight),
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + '20',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: '趋势线',
                        data: trendLine,
                        borderColor: colors.colors[1],
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.text === '#D1D5DB' ? '#1F2937' : '#fff',
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.grid,
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y.toFixed(1);
                                return `${label}: ${value} kg`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.text,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: colors.text,
                            callback: function(value) {
                                return value.toFixed(1) + ' kg';
                            }
                        }
                    }
                }
            }
        };

        if (weightChart) {
            weightChart.data = config.data;
            weightChart.options = config.options;
            weightChart.update();
        } else {
            weightChart = new Chart(ctx, config);
        }
    } catch (error) {
        console.error('Error updating weight chart:', error);
    }
}

/**
 * Update chart colors when theme changes
 */
function updateChartTheme() {
    if (weeklyChart) updateWeeklyChart();
    if (typeChart) updateTypeChart();
    if (weightChart) updateWeightChart();
}

/**
 * Destroy all charts
 */
function destroyCharts() {
    if (weeklyChart) {
        weeklyChart.destroy();
        weeklyChart = null;
    }
    if (typeChart) {
        typeChart.destroy();
        typeChart = null;
    }
    if (weightChart) {
        weightChart.destroy();
        weightChart = null;
    }
}

// Listen for theme changes
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            setTimeout(updateChartTheme, 100);
        });
    }
});

// Export for use in app.js
const Charts = {
    updateCharts,
    updateWeeklyChart,
    updateTypeChart,
    updateWeightChart,
    updateChartTheme,
    destroyCharts
};
