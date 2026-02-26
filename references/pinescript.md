# Pine Script® Reference

**Always remember to reference @$HOME/.claude/references/pinescript.md and look for snippets and examples in @$HOME/.claude/snippets/pinescript/**

## Quick Reference

- Installation: Via TradingView Pine Script® Editor
- Documentation: <https://www.tradingview.com/pine-script-docs/>
- Community: <https://www.tradingview.com/chat/>
- GitHub Examples: <https://github.com/tradingview/charting-library-examples>
- Lightweight Charts: <https://github.com/tradingview/lightweight-charts>

## Resources and Documentation

- [Pine Script® User Manual](https://www.tradingview.com/pine-script-docs/)
  - [Getting Started](https://www.tradingview.com/pine-script-docs/welcome/primer/)
    - [First Steps](https://www.tradingview.com/pine-script-docs/welcome/primer/first-steps/)
    - [Next Steps](https://www.tradingview.com/pine-script-docs/welcome/primer/next-steps/)
  - [Language Reference](https://www.tradingview.com/pine-script-docs/welcome/language/)
    - [Execution Model](https://www.tradingview.com/pine-script-docs/welcome/language/execution-model/)
    - [Type System](https://www.tradingview.com/pine-script-docs/welcome/language/type-system/)
    - [Operators](https://www.tradingview.com/pine-script-docs/welcome/language/operators/)
    - [Built-ins](https://www.tradingview.com/pine-script-docs/welcome/language/built-ins/)
    - [Functions](https://www.tradingview.com/pine-script-docs/welcome/language/functions/)
  - [Concepts](https://www.tradingview.com/pine-script-docs/welcome/concepts/)
    - [Alerts](https://www.tradingview.com/pine-script-docs/welcome/concepts/alerts/)
    - [Strategies](https://www.tradingview.com/pine-script-docs/welcome/concepts/strategies/)
    - [Indicators](https://www.tradingview.com/pine-script-docs/welcome/concepts/indicators/)
    - [Plots](https://www.tradingview.com/pine-script-docs/welcome/concepts/plots/)
    - [Colors](https://www.tradingview.com/pine-script-docs/welcome/concepts/colors/)
    - [Lines and Boxes](https://www.tradingview.com/pine-script-docs/welcome/concepts/lines-and-boxes/)
    - [Time](https://www.tradingview.com/pine-script-docs/welcome/concepts/time/)
    - [Sessions](https://www.tradingview.com/pine-script-docs/welcome/concepts/sessions/)
    - [Chart Information](https://www.tradingview.com/pine-script-docs/welcome/concepts/chart-information/)
  - [Writing Scripts](https://www.tradingview.com/pine-script-docs/welcome/writing/)
    - [Debugging](https://www.tradingview.com/pine-script-docs/welcome/writing/debugging/)
    - [Optimization](https://www.tradingview.com/pine-script-docs/welcome/writing/optimization/)
    - [Publishing](https://www.tradingview.com/pine-script-docs/welcome/writing/publishing/)
    - [Limitations](https://www.tradingview.com/pine-script-docs/welcome/writing/limitations/)
  - [FAQ](https://www.tradingview.com/pine-script-docs/welcome/faq/)
    - [Strategies](https://www.tradingview.com/pine-script-docs/welcome/faq/strategies/)
    - [Alerts](https://www.tradingview.com/pine-script-docs/welcome/faq/alerts/)
  - [Migration Guides](https://www.tradingview.com/pine-script-docs/welcome/migration/)
  - [Release Notes](https://www.tradingview.com/pine-script-docs/welcome/release-notes/)

- [TradingView Charting Library](https://www.tradingview.com/charting-library-docs/)
  - [Getting Started](https://www.tradingview.com/charting-library-docs/latest/)
  - [Tutorials](https://www.tradingview.com/charting-library-docs/latest/tutorials/)
  - [API Reference](https://www.tradingview.com/charting-library-docs/latest/api/)
  - [GitHub Examples](https://github.com/tradingview/charting-library-examples)

- [TradingView Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
  - [Documentation](https://tradingview.github.io/lightweight-charts/docs/)
  - [API Reference](https://tradingview.github.io/lightweight-charts/docs/api/)
  - [Tutorials](https://tradingview.github.io/lightweight-charts/tutorials/)
  - [Plugin Examples](https://tradingview.github.io/lightweight-charts/plugin-examples/)

- [Community Resources](https://www.tradingview.com/community/)
  - [Pine Q&A Chat](https://www.tradingview.com/chat/)
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/pine-script)
  - [Telegram Community](https://t.me/pinescriptchat)
  - [Reddit Community](https://www.reddit.com/r/TradingView/)
  - [Discord](https://discord.gg/tradingview)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/pinescript/`:

- Basic indicator creation patterns
- Strategy development and backtesting
- Alert configuration and management
- Chart visualization and plotting
- Technical analysis implementations
- Risk management patterns
- Performance optimization techniques
- API integration examples
- Advanced Pine Script patterns

## Core Concepts

### Script Types

- **Indicators**: Perform calculations and plot data on charts without backtesting capability
- **Strategies**: Include backtesting functionality with `strategy.*()` calls for trade simulation
- **Libraries**: Reusable functions that can be imported into other scripts

### Version Management

- **@version=6**: Latest Pine Script version with enhanced features
- **Backward Compatibility**: Support for older versions with migration guides
- **Feature Updates**: Regular releases with new built-in functions and improvements

### Execution Model

- **Bar-by-Bar Execution**: Scripts execute once per historical bar and on each real-time tick
- **Historical vs Real-time**: Different behavior between backtesting and live execution
- **Event-Driven**: Scripts respond to price changes, time events, and user interactions

## Key Pine Script Features

### Built-in Functions and Variables

- **Price Data**: `open`, `high`, `low`, `close`, `volume`, `hl2`, `hlc3`, `ohlc4`
- **Technical Analysis**: `ta.*` namespace with 100+ indicators (SMA, EMA, RSI, MACD, etc.)
- **Math Functions**: `math.*` namespace for mathematical operations
- **String Functions**: `str.*` namespace for text manipulation
- **Array/Matrix Operations**: Advanced data structure handling
- **Time Functions**: `time`, `timestamp()`, session management

### Strategy Development

- **Order Types**: Market, limit, stop, and stop-limit orders
- **Position Management**: Entry, exit, and position sizing
- **Risk Management**: Stop-loss, take-profit, and trailing stops
- **Performance Analytics**: Built-in metrics and custom calculations
- **Broker Emulator**: Realistic trade simulation with slippage and commission

### Chart Visualization

- **Plotting**: Lines, histograms, columns, circles, and custom shapes
- **Colors**: Dynamic color schemes and transparency
- **Labels and Lines**: Annotations and drawing objects
- **Tables**: Data display in organized formats
- **Background Colors**: Conditional chart highlighting

### Alert System

- **Condition-based Alerts**: Trigger alerts on custom conditions
- **Strategy Alerts**: Automated alerts from strategy order fills
- **Message Templates**: Dynamic alert messages with placeholders
- **Webhook Integration**: Connect to external systems and APIs

## TradingView Integration APIs

### Charting Library

- **Widget Integration**: Embed full-featured charts in web applications
- **Custom Data Feeds**: Connect to any data provider
- **Localization**: Support for multiple languages and regions
- **Theming**: Customizable chart appearance and styling

### Lightweight Charts

- **Performance Optimized**: Minimal overhead for high-frequency data
- **TypeScript Support**: Full type definitions and IntelliSense
- **Plugin System**: Extensible architecture for custom features
- **Canvas Rendering**: Hardware-accelerated chart rendering

### REST API Integration

- **Market Data**: Access to real-time and historical price data
- **Symbol Information**: Comprehensive symbol metadata
- **Economic Calendar**: Economic events and announcements
- **News Feed**: Financial news and analysis

## Advanced Features

### Libraries and Imports

- **Custom Libraries**: Create reusable function collections
- **Import System**: Share and use community libraries
- **Namespace Management**: Organize code with proper scoping
- **Version Control**: Library versioning and dependency management

### Performance Optimization

- **Execution Efficiency**: Optimize calculation frequency and complexity
- **Memory Management**: Handle large datasets and historical data
- **Rendering Performance**: Optimize plot and drawing operations
- **Compilation Limits**: Work within Pine Script execution constraints

### Security and Best Practices

- **Code Security**: Avoid exposing sensitive information
- **Performance Guidelines**: Write efficient and scalable scripts
- **Publishing Standards**: Follow TradingView community guidelines
- **Testing Strategies**: Validate scripts across different market conditions

## Integration Patterns

### Web Application Integration

- **JavaScript SDK**: TradingView Charting Library for web apps
- **Lightweight Charts**: Standalone charting solution
- **Custom Data Feeds**: Real-time data integration
- **Event Handling**: User interaction and chart events

### API Connectivity

- **Webhook Alerts**: Connect Pine Script alerts to external services
- **REST API Integration**: Fetch external data into Pine Script
- **Trading Platform Integration**: Connect strategies to live trading
- **Database Storage**: Store and retrieve custom data

### Mobile and Desktop

- **Cross-Platform**: Scripts work across all TradingView platforms
- **Mobile Optimization**: Touch-friendly interface adaptations
- **Desktop Applications**: Standalone trading applications
- **Cloud Synchronization**: Settings and alerts sync across devices

## Development Workflow

### Script Development Lifecycle

1. **Planning**: Define requirements and trading logic
2. **Development**: Write and test Pine Script code
3. **Debugging**: Use built-in debugging tools and techniques
4. **Optimization**: Improve performance and resource usage
5. **Testing**: Validate across different markets and timeframes
6. **Publishing**: Share scripts with the TradingView community
7. **Maintenance**: Update and improve based on feedback

### Testing and Validation

- **Backtesting**: Historical performance validation
- **Forward Testing**: Real-time strategy validation
- **Paper Trading**: Risk-free testing with live data
- **A/B Testing**: Compare different strategy variations
- **Performance Metrics**: Analyze returns, drawdown, and risk metrics

### Collaboration and Sharing

- **Script Publishing**: Share with TradingView community
- **Version Control**: Track changes and improvements
- **Documentation**: Comprehensive script documentation
- **Community Feedback**: Gather and implement user feedback

## See Also

- Complete reference: `@$HOME/.claude/references/pinescript.md`
- Code examples: `@$HOME/.claude/snippets/pinescript/`
- Schemas: `@$HOME/.claude/snippets/pinescript/schemas/`
- Official documentation: <https://www.tradingview.com/pine-script-docs/>
- Community resources: <https://www.tradingview.com/chat/>
