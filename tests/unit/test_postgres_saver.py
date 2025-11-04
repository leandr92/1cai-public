"""
Unit tests for PostgreSQLSaver
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from src.db.postgres_saver import PostgreSQLSaver


class TestPostgreSQLSaver:
    """Test PostgreSQL saver functionality"""
    
    @patch('psycopg2.connect')
    def test_connect_success(self, mock_connect):
        """Test successful database connection"""
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        
        saver = PostgreSQLSaver(password='test')
        result = saver.connect()
        
        assert result is True
        assert saver.conn is not None
        mock_connect.assert_called_once()
    
    @patch('psycopg2.connect')
    def test_connect_failure(self, mock_connect):
        """Test connection failure handling"""
        mock_connect.side_effect = Exception("Connection failed")
        
        saver = PostgreSQLSaver(password='test')
        result = saver.connect()
        
        assert result is False
    
    @patch('psycopg2.connect')
    def test_save_configuration(self, mock_connect, sample_configuration_data):
        """Test saving configuration"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = ['test-uuid']
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        saver = PostgreSQLSaver(password='test')
        saver.connect()
        
        config_id = saver.save_configuration(sample_configuration_data)
        
        assert config_id == 'test-uuid'
        assert mock_cursor.execute.called
        assert mock_conn.commit.called
    
    @patch('psycopg2.connect')
    def test_save_module(self, mock_connect, sample_module_data):
        """Test saving module"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = ['module-uuid']
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        saver = PostgreSQLSaver(password='test')
        saver.connect()
        
        module_id = saver.save_module('config-id', sample_module_data)
        
        assert module_id == 'module-uuid'
        # Should save functions too
        assert mock_cursor.execute.call_count >= 2  # module + functions
    
    @patch('psycopg2.connect')
    def test_get_statistics(self, mock_connect):
        """Test getting statistics"""
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = (5, 100, 500, 3000, 50000)
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        
        saver = PostgreSQLSaver(password='test')
        saver.connect()
        
        stats = saver.get_statistics()
        
        assert stats['configurations'] == 5
        assert stats['objects'] == 100
        assert stats['modules'] == 500
        assert stats['functions'] == 3000
        assert stats['total_lines'] == 50000
    
    @patch('psycopg2.connect')
    def test_context_manager(self, mock_connect):
        """Test context manager usage"""
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        
        with PostgreSQLSaver(password='test') as saver:
            assert saver.conn is not None
        
        # Should disconnect on exit
        assert mock_conn.close.called





