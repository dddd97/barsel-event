namespace :db do
  desc "Analyze database performance and provide optimization recommendations"
  task performance: :environment do
    puts "🔍 Database Performance Analysis Report"
    puts "=" * 50
    
    # Check for unused indexes
    unused_indexes = check_unused_indexes
    puts "\n📊 Index Analysis:"
    puts "-" * 20
    if unused_indexes.any?
      puts "⚠️  Found #{unused_indexes.count} unused indexes:"
      unused_indexes.each do |idx|
        puts "  • #{idx['indexname']} on #{idx['tablename']}"
      end
      puts "\n💡 Consider removing unused indexes to improve write performance"
    else
      puts "✅ All indexes are being used"
    end
    
    # Check for missing indexes
    missing_indexes = check_missing_indexes
    puts "\n🔍 Missing Index Suggestions:"
    puts "-" * 30
    if missing_indexes.any?
      puts "⚠️  Recommended indexes to add:"
      missing_indexes.each do |suggestion|
        puts "  • #{suggestion}"
      end
    else
      puts "✅ No obvious missing indexes detected"
    end
    
    # Check query performance
    slow_queries = check_slow_queries
    puts "\n🐌 Slow Query Analysis:"
    puts "-" * 25
    if slow_queries.any?
      puts "⚠️  Found #{slow_queries.count} potentially slow queries:"
      slow_queries.each do |query|
        puts "  • Table: #{query['table_name']}, Seq Scans: #{query['seq_scan']}, Seq Tup Read: #{query['seq_tup_read']}"
      end
      puts "\n💡 Consider adding indexes for frequently scanned tables"
    else
      puts "✅ No major performance issues detected"
    end
    
    # Check database size and growth
    database_stats = check_database_stats
    puts "\n💾 Database Statistics:"
    puts "-" * 25
    puts "  • Database size: #{format_bytes(database_stats['size'])}"
    puts "  • Number of connections: #{database_stats['connections']}"
    puts "  • Cache hit ratio: #{database_stats['cache_hit_ratio']}%"
    
    # Check table statistics
    table_stats = check_table_stats
    puts "\n📋 Top 5 Largest Tables:"
    puts "-" * 25
    table_stats.first(5).each do |table|
      puts "  • #{table['table_name']}: #{format_bytes(table['size'])}"
    end
    
    # Performance recommendations
    puts "\n🎯 Performance Recommendations:"
    puts "-" * 35
    recommendations = generate_recommendations(unused_indexes, missing_indexes, slow_queries, database_stats)
    recommendations.each_with_index do |rec, index|
      puts "  #{index + 1}. #{rec}"
    end
    
    puts "\n" + "=" * 50
    puts "📝 Run this task regularly to monitor database health"
  end
  
  desc "Monitor real-time database performance"
  task monitor: :environment do
    puts "📊 Real-time Database Monitoring (Press Ctrl+C to stop)"
    puts "=" * 60
    
    begin
      loop do
        stats = get_realtime_stats
        
        system('clear') || system('cls')
        puts "📊 Database Monitor - #{Time.current.strftime('%Y-%m-%d %H:%M:%S')}"
        puts "=" * 60
        
        puts "🔄 Active Connections: #{stats['active_connections']}"
        puts "💾 Cache Hit Ratio: #{stats['cache_hit_ratio']}%"
        puts "📖 Total Queries: #{stats['total_queries']}"
        puts "⏱️  Average Query Time: #{stats['avg_query_time']}ms"
        puts "🔒 Locks: #{stats['locks']}"
        puts "💽 Disk I/O: #{stats['disk_reads']} reads, #{stats['disk_writes']} writes"
        
        puts "\n🏃 Active Queries:"
        puts "-" * 20
        active_queries = stats['active_queries']
        if active_queries.any?
          active_queries.first(5).each do |query|
            duration = (query['duration'] || 0).round(2)
            puts "  • #{query['query'][0..80]}... (#{duration}s)"
          end
        else
          puts "  No active queries"
        end
        
        sleep 5
      end
    rescue Interrupt
      puts "\n\n👋 Monitoring stopped"
    end
  end
  
  desc "Reset counter caches for all models"
  task reset_counters: :environment do
    puts "🔄 Resetting counter caches..."
    
    # Reset participants counter cache
    puts "  • Resetting participants_count for events..."
    Event.find_each do |event|
      Event.reset_counters(event.id, :participants)
    end
    
    # Reset winnings counter cache
    puts "  • Resetting winnings_count for prizes..."
    Prize.find_each do |prize|
      Prize.reset_counters(prize.id, :winnings)
    end
    
    puts "✅ Counter caches reset successfully"
  end
  
  private
  
  def check_unused_indexes
    ActiveRecord::Base.connection.exec_query(
      "SELECT schemaname, tablename, indexname, idx_scan 
       FROM pg_stat_user_indexes 
       WHERE idx_scan = 0 
       AND indexname NOT LIKE '%_pkey' 
       AND indexname NOT LIKE '%_id_index'
       ORDER BY indexname"
    )
  end
  
  def check_missing_indexes
    suggestions = []
    
    # Check for foreign keys without indexes
    foreign_keys = ActiveRecord::Base.connection.exec_query(
      "SELECT tc.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu 
         ON tc.constraint_name = kcu.constraint_name
       WHERE constraint_type = 'FOREIGN KEY'"
    )
    
    foreign_keys.each do |fk|
      # Check if there's an index on this foreign key
      index_exists = ActiveRecord::Base.connection.exec_query(
        "SELECT 1 FROM pg_indexes 
         WHERE tablename = '#{fk['table_name']}' 
         AND indexdef LIKE '%#{fk['column_name']}%'"
      ).any?
      
      unless index_exists
        suggestions << "CREATE INDEX idx_#{fk['table_name']}_#{fk['column_name']} ON #{fk['table_name']} (#{fk['column_name']})"
      end
    end
    
    suggestions
  end
  
  def check_slow_queries
    ActiveRecord::Base.connection.exec_query(
      "SELECT schemaname, tablename, seq_scan, seq_tup_read,
              idx_scan, idx_tup_fetch
       FROM pg_stat_user_tables 
       WHERE seq_scan > 1000 OR seq_tup_read > 100000
       ORDER BY seq_tup_read DESC"
    )
  end
  
  def check_database_stats
    size_result = ActiveRecord::Base.connection.exec_query(
      "SELECT pg_size_pretty(pg_database_size(current_database())) as size"
    ).first
    
    connections_result = ActiveRecord::Base.connection.exec_query(
      "SELECT count(*) as connections FROM pg_stat_activity"
    ).first
    
    cache_result = ActiveRecord::Base.connection.exec_query(
      "SELECT round(blks_hit*100.0/(blks_hit+blks_read), 2) as cache_hit_ratio
       FROM pg_stat_database 
       WHERE datname = current_database()"
    ).first
    
    {
      'size' => size_result['size'],
      'connections' => connections_result['connections'],
      'cache_hit_ratio' => cache_result['cache_hit_ratio'] || 0
    }
  end
  
  def check_table_stats
    ActiveRecord::Base.connection.exec_query(
      "SELECT tablename as table_name,
              pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
              pg_total_relation_size(tablename::regclass) as size_bytes
       FROM pg_tables 
       WHERE schemaname = 'public'
       ORDER BY size_bytes DESC"
    )
  end
  
  def get_realtime_stats
    # Active connections
    active_conn = ActiveRecord::Base.connection.exec_query(
      "SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'"
    ).first['count']
    
    # Cache hit ratio
    cache_hit = ActiveRecord::Base.connection.exec_query(
      "SELECT round(blks_hit*100.0/(blks_hit+blks_read), 2) as ratio
       FROM pg_stat_database WHERE datname = current_database()"
    ).first['ratio'] || 0
    
    # Query stats
    query_stats = ActiveRecord::Base.connection.exec_query(
      "SELECT calls as total_queries, mean_time as avg_time
       FROM pg_stat_statements 
       ORDER BY calls DESC LIMIT 1"
    ).first rescue { 'total_queries' => 0, 'avg_time' => 0 }
    
    # Locks
    locks = ActiveRecord::Base.connection.exec_query(
      "SELECT count(*) as count FROM pg_locks"
    ).first['count']
    
    # Disk I/O
    io_stats = ActiveRecord::Base.connection.exec_query(
      "SELECT sum(blks_read) as reads, sum(blks_hit) as writes 
       FROM pg_stat_user_tables"
    ).first
    
    # Active queries
    active_queries = ActiveRecord::Base.connection.exec_query(
      "SELECT query, extract(epoch from now() - query_start) as duration
       FROM pg_stat_activity 
       WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
       ORDER BY query_start"
    )
    
    {
      'active_connections' => active_conn,
      'cache_hit_ratio' => cache_hit,
      'total_queries' => query_stats['total_queries'] || 0,
      'avg_query_time' => (query_stats['avg_time'] || 0).round(2),
      'locks' => locks,
      'disk_reads' => io_stats['reads'] || 0,
      'disk_writes' => io_stats['writes'] || 0,
      'active_queries' => active_queries
    }
  end
  
  def generate_recommendations(unused_indexes, missing_indexes, slow_queries, database_stats)
    recommendations = []
    
    if unused_indexes.any?
      recommendations << "Remove #{unused_indexes.count} unused indexes to improve write performance"
    end
    
    if missing_indexes.any?
      recommendations << "Add #{missing_indexes.count} missing indexes for foreign keys"
    end
    
    if slow_queries.any?
      recommendations << "Optimize queries for #{slow_queries.count} tables with high sequential scans"
    end
    
    cache_ratio = database_stats['cache_hit_ratio'].to_f
    if cache_ratio < 95
      recommendations << "Increase shared_buffers or work_mem - cache hit ratio is #{cache_ratio}%"
    end
    
    if database_stats['connections'].to_i > 20
      recommendations << "Consider connection pooling - currently #{database_stats['connections']} connections"
    end
    
    if recommendations.empty?
      recommendations << "Database performance looks good! 🎉"
    end
    
    recommendations
  end
  
  def format_bytes(size_string)
    # PostgreSQL pg_size_pretty already formats it nicely
    size_string
  end
end